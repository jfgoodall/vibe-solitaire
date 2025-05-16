class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.faceUp = true;
        this.element = this.createCardElement();
        this.setupDragListeners();
    }

    setupDragListeners() {
        this.element.addEventListener('dragstart', (e) => {
            if (!this.faceUp) {
                e.preventDefault();
                return;
            }
            
            // Get the stack and create visual representation
            const stack = window.solitaireGame.getCardStack(this.element);
            if (stack && stack.length > 1) {
                const stackWrapper = window.solitaireGame.createDragStackPreview(this.element, stack);
                e.dataTransfer.setDragImage(stackWrapper, 10, 10);
            }

            this.element.classList.add('dragging');
            window.solitaireGame.draggingElement = this.element;
            window.solitaireGame.draggingStack = stack;
            e.dataTransfer.setData('text/plain', '');
            e.dataTransfer.effectAllowed = 'move';
        });

        this.element.addEventListener('dragend', (e) => {
            this.element.classList.remove('dragging');
            window.solitaireGame.draggingElement = null;
            window.solitaireGame.draggingStack = null;
            window.solitaireGame.removeDragStackPreview();
        });
    }

    createCardElement() {
        const card = document.createElement('div');
        card.className = 'card';
        card.draggable = true;

        const content = document.createElement('div');
        content.className = 'card-content';
        
        const suitElement = document.createElement('div');
        suitElement.className = 'card-suit';
        
        const suitSymbols = {
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣',
            'spades': '♠'
        };
        
        const rankSymbols = {
            1: 'A',
            11: 'J',
            12: 'Q',
            13: 'K'
        };

        const displayRank = rankSymbols[this.rank] || this.rank;
        content.textContent = displayRank;
        suitElement.textContent = suitSymbols[this.suit];
        
        card.appendChild(content);
        card.appendChild(suitElement);

        if (this.suit === 'hearts' || this.suit === 'diamonds') {
            card.classList.add('red');
        } else {
            card.classList.add('black');
        }

        if (!this.faceUp) {
            card.classList.add('facedown');
        }

        return card;
    }

    flip() {
        this.faceUp = !this.faceUp;
        this.element.classList.toggle('facedown');
    }
}

class Solitaire {
    constructor() {
        this.deck = [];
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableaus = [[], [], [], [], [], [], []];
        this.draggingElement = null;
        this.draggingStack = null;
        this.dragPreview = null;
        this.isHandlingClick = false;  // Add click handling protection
        window.solitaireGame = this;
        this.setupGame();
    }

    setupGame() {
        this.createDeck();
        this.shuffleDeck();
        this.dealCards();
        this.setupEventListeners();
    }

    createDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks = Array.from({length: 13}, (_, i) => i + 1);

        for (const suit of suits) {
            for (const rank of ranks) {
                this.deck.push(new Card(suit, rank));
            }
        }
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards() {
        // Deal to tableaus
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = this.deck.pop();
                if (i !== j) {
                    card.flip(); // Flip cards face down except the top card
                }
                this.tableaus[j].push(card);
                this.updateCardPosition(card, `tableau-${j}`);
            }
        }

        // Remaining cards go to deck
        const deckElement = document.getElementById('deck');
        this.deck.forEach(card => {
            card.flip(); // Deck cards start face down
            this.updateCardPosition(card, 'deck');
        });
    }

    setupEventListeners() {
        // Deck click event with debounce
        const deckElement = document.getElementById('deck');
        deckElement.addEventListener('click', (e) => {
            // Prevent click if we're dragging
            if (this.draggingElement) {
                return;
            }
            this.handleDeckClick();
        });

        // Drag and drop events
        document.querySelectorAll('.card-stack').forEach(stack => {
            stack.addEventListener('dragover', (e) => this.handleDragOver(e));
            stack.addEventListener('drop', (e) => this.handleDrop(e));
            
            // Add double-click handling for all stacks
            stack.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        });

        // New game button
        document.getElementById('new-game').addEventListener('click', () => this.startNewGame());

        // Win message "Play Again" button
        const playAgainBtn = document.querySelector('.win-message button');
        playAgainBtn.onclick = () => this.startNewGame();
    }

    handleDoubleClick(e) {
        const cardElement = e.target.closest('.card');
        if (!cardElement) return;

        const sourceStackId = this.findStack(cardElement);
        if (!sourceStackId) return;

        const sourceArray = this.getStackArray(sourceStackId);
        if (!sourceArray) return;

        const card = sourceArray.find(c => c.element === cardElement);
        if (!card || !card.faceUp) return;

        // Try to find a valid foundation to move to
        for (let i = 0; i < 4; i++) {
            const targetStackId = `foundation-${i}`;
            const targetArray = this.foundations[i];

            // Temporarily set draggingElement for isValidMove check
            this.draggingElement = cardElement;
            this.draggingStack = null;

            if (this.isValidMove(sourceStackId, targetStackId)) {
                this.moveCard(sourceStackId, targetStackId);
                break;
            }
        }

        // Clear temporary dragging state
        this.draggingElement = null;
        this.draggingStack = null;
    }

    handleDeckClick() {
        // Prevent double-triggering
        if (this.isHandlingClick) {
            return;
        }
        
        this.isHandlingClick = true;
        setTimeout(() => {
            this.isHandlingClick = false;
        }, 100);

        if (this.deck.length === 0) {
            console.log('Recycling waste pile back to deck');
            // Flip waste back to deck, maintaining order
            this.deck = this.waste.reverse();
            this.waste = [];
            
            // Flip all cards face down and update their positions
            this.deck.forEach(card => {
                card.flip();
                this.updateCardPosition(card, 'deck');
            });
            console.log(`Deck refilled with ${this.deck.length} cards`);
        } else {
            // Move top card to waste
            const card = this.deck.pop();
            card.flip();
            this.waste.push(card);
            this.updateCardPosition(card, 'waste');

            // Debug logging
            const wasteCards = this.waste.map(c => `${c.rank}${c.suit.charAt(0).toUpperCase()}`).reverse();
            console.log(
                `Waste pile (top→bottom): %c${wasteCards[0]}%c ${wasteCards.slice(1).join(' ')} | Deck: ${this.deck.length}`,
                'font-weight: bold; color: green',
                'font-weight: normal; color: inherit'
            );
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        // Add visual feedback for valid drop targets
        const target = e.target.closest('.card-stack');
        if (target && this.draggingElement) {
            const sourceStack = this.findStack(this.draggingElement);
            if (this.isValidMove(sourceStack, target.id)) {
                e.dataTransfer.dropEffect = 'move';
            }
        }
    }

    handleDrop(e) {
        e.preventDefault();
        if (!this.draggingElement) return;

        const target = e.target.closest('.card-stack');
        if (!target) return;

        const sourceStack = this.findStack(this.draggingElement);
        const targetStack = target.id;

        if (this.isValidMove(sourceStack, targetStack)) {
            this.moveCard(sourceStack, targetStack);
            this.checkWinCondition();
        }
    }

    findStack(cardElement) {
        const stack = cardElement.closest('.card-stack');
        return stack ? stack.id : null;
    }

    getStackArray(stackId) {
        if (stackId === 'deck') return this.deck;
        if (stackId === 'waste') return this.waste;
        if (stackId.startsWith('foundation-')) {
            const index = parseInt(stackId.split('-')[1]);
            return this.foundations[index];
        }
        if (stackId.startsWith('tableau-')) {
            const index = parseInt(stackId.split('-')[1]);
            return this.tableaus[index];
        }
        return null;
    }

    isValidMove(sourceStack, targetStack) {
        if (!sourceStack || !targetStack) return false;

        const sourceArray = this.getStackArray(sourceStack);
        const targetArray = this.getStackArray(targetStack);
        if (!sourceArray || !targetArray) return false;

        const movingCard = this.draggingElement ? 
            sourceArray.find(card => card.element === this.draggingElement) : null;
        if (!movingCard) return false;

        // Only face-up cards can be moved
        if (!movingCard.faceUp) return false;

        // Foundation rules
        if (targetStack.startsWith('foundation-')) {
            // Only allow single cards to foundations
            if (this.draggingStack && this.draggingStack.length > 1) return false;
            
            if (targetArray.length === 0) {
                // Only aces can start a foundation
                return movingCard.rank === 1;
            } else {
                const topCard = targetArray[targetArray.length - 1];
                // Must be same suit and next rank up
                return movingCard.suit === topCard.suit && 
                       movingCard.rank === topCard.rank + 1;
            }
        }

        // Tableau rules
        if (targetStack.startsWith('tableau-')) {
            if (targetArray.length === 0) {
                // Only kings can start a new tableau
                return movingCard.rank === 13;
            } else {
                const topCard = targetArray[targetArray.length - 1];
                // Must be opposite color and next rank down
                const isOppositeColor = (
                    (movingCard.suit === 'hearts' || movingCard.suit === 'diamonds') !==
                    (topCard.suit === 'hearts' || topCard.suit === 'diamonds')
                );
                return isOppositeColor && movingCard.rank === topCard.rank - 1;
            }
        }

        return false;
    }

    moveCard(sourceStackId, targetStackId) {
        // Get source and target arrays
        const sourceArray = this.getStackArray(sourceStackId);
        const targetArray = this.getStackArray(targetStackId);
        
        if (!sourceArray || !targetArray) return;

        // Find the card in the source array
        const cardElement = this.draggingElement;
        const cardIndex = sourceArray.findIndex(card => card.element === cardElement);
        
        if (cardIndex === -1) return;

        let cardsToMove;
        if (this.draggingStack && sourceStackId.startsWith('tableau-')) {
            // Move the whole stack
            cardsToMove = sourceArray.splice(cardIndex);
        } else {
            // Move single card
            cardsToMove = [sourceArray.splice(cardIndex, 1)[0]];
        }

        // Add cards to target
        targetArray.push(...cardsToMove);

        // If this is a double-click move to foundation, animate it
        if (targetStackId.startsWith('foundation-') && !this.draggingStack) {
            const card = cardsToMove[0];
            const cardElement = card.element;
            const targetStack = document.getElementById(targetStackId);
            
            // Store original styles
            const originalPosition = window.getComputedStyle(cardElement).position;
            const originalTop = cardElement.style.top;
            const originalLeft = cardElement.style.left;
            
            // Get the current position relative to the viewport
            const cardRect = cardElement.getBoundingClientRect();
            const targetRect = targetStack.getBoundingClientRect();
            
            // Create a temporary wrapper to maintain the card's position during animation
            const wrapper = document.createElement('div');
            wrapper.style.position = 'fixed';
            wrapper.style.top = cardRect.top + 'px';
            wrapper.style.left = cardRect.left + 'px';
            wrapper.style.width = cardRect.width + 'px';
            wrapper.style.height = cardRect.height + 'px';
            wrapper.style.zIndex = '1000';
            wrapper.style.pointerEvents = 'none';
            
            // Move the card to the wrapper
            cardElement.style.position = 'relative';
            cardElement.style.top = '0';
            cardElement.style.left = '0';
            wrapper.appendChild(cardElement);
            document.body.appendChild(wrapper);
            
            // Add the animation class to the wrapper
            wrapper.classList.add('moving-to-foundation');
            
            // Force a reflow
            wrapper.offsetHeight;
            
            // Animate to target position
            wrapper.style.top = targetRect.top + 'px';
            wrapper.style.left = targetRect.left + 'px';
            
            // After animation completes
            setTimeout(() => {
                // Restore card to its original state
                cardElement.style.position = originalPosition;
                cardElement.style.top = originalTop;
                cardElement.style.left = originalLeft;
                
                // Move card back to the target stack
                targetStack.appendChild(cardElement);
                wrapper.remove();
                
                // Update the final position
                this.updateCardPosition(card, targetStackId);
                
                // Check win condition
                this.checkWinCondition();
            }, 300);
        } else {
            // Update the DOM for all moved cards normally
            cardsToMove.forEach(card => {
                this.updateCardPosition(card, targetStackId);
            });
            // Check win condition immediately for non-animated moves
            this.checkWinCondition();
        }

        // If we exposed a new top card in the source stack, flip it
        if (sourceStackId.startsWith('tableau-') && sourceArray.length > 0) {
            const topCard = sourceArray[sourceArray.length - 1];
            if (!topCard.faceUp) {
                topCard.flip();
            }
        }
    }

    updateCardPosition(card, stackId) {
        const stack = document.getElementById(stackId);
        if (stack) {
            const existingCards = stack.children.length;
            card.element.style.left = '0';
            
            if (stackId.startsWith('tableau-')) {
                card.element.style.top = `${existingCards * 30}px`;
            } else {
                card.element.style.top = '0';
            }
            stack.appendChild(card.element);

            // For waste pile, adjust the positions of all cards to show slight overlap
            if (stackId === 'waste') {
                const cards = stack.children;
                for (let i = 0; i < cards.length - 1; i++) {
                    cards[i].style.left = '-8px';  // Match the CSS --waste-offset value
                }
                if (cards.length > 0) {
                    cards[cards.length - 1].style.left = '0';
                }
            }
        }
    }

    checkWinCondition() {
        // Check if all foundations are complete (13 cards each, with King on top)
        const isComplete = this.foundations.every(foundation => {
            return foundation.length === 13 && 
                   foundation[foundation.length - 1].rank === 13;
        });

        if (isComplete) {
            this.showWinMessage();
        }
    }

    showWinMessage() {
        const winMessage = document.getElementById('win-message');
        winMessage.classList.add('show');
    }

    startNewGame() {
        // Clear all stacks
        this.deck = [];
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableaus = [[], [], [], [], [], [], []];

        // Remove all cards from DOM
        document.querySelectorAll('.card').forEach(card => card.remove());

        // Hide win message
        document.getElementById('win-message').classList.remove('show');

        // Setup new game
        this.setupGame();
    }

    getCardStack(cardElement) {
        const stackId = this.findStack(cardElement);
        if (!stackId || !stackId.startsWith('tableau-')) return null;

        const stack = this.getStackArray(stackId);
        if (!stack) return null;

        // Find the index of the card in its tableau
        const cardIndex = stack.findIndex(card => card.element === cardElement);
        if (cardIndex === -1) return null;

        // Return all cards from this index to the end
        return stack.slice(cardIndex);
    }

    createDragStackPreview(cardElement, stack) {
        // Remove any existing preview
        this.removeDragStackPreview();

        // Create a wrapper for the stack
        const wrapper = document.createElement('div');
        wrapper.className = 'dragging-stack';
        
        // Get the card's current position
        const cardRect = cardElement.getBoundingClientRect();
        
        // Position the wrapper at the card's location
        wrapper.style.position = 'fixed';
        wrapper.style.top = cardRect.top + 'px';
        wrapper.style.left = cardRect.left + 'px';
        wrapper.style.width = cardRect.width + 'px';
        wrapper.style.height = cardRect.height + 'px';

        // Clone each card in the stack and add it to the wrapper
        stack.forEach((card, index) => {
            const clone = card.element.cloneNode(true);
            clone.style.top = (index * 30) + 'px';  // Use the same offset as in updateCardPosition
            wrapper.appendChild(clone);
        });

        // Add to document and store reference
        document.body.appendChild(wrapper);
        this.dragPreview = wrapper;

        return wrapper;
    }

    removeDragStackPreview() {
        if (this.dragPreview) {
            this.dragPreview.remove();
            this.dragPreview = null;
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    const game = new Solitaire();
}); 