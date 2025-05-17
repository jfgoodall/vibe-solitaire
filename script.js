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
        card.classList.add('faceup');
        card.classList.add(`suit-${this.suit}`);

        // Add rank and suit to corners
        this.addCorners(card);

        // Add pips or court figure based on rank
        if (this.rank > 10) {
            this.addCourtFigure(card);
        } else {
            this.addPips(card);
        }

        if (this.suit === 'hearts' || this.suit === 'diamonds') {
            card.classList.add('red');
        } else {
            card.classList.add('black');
        }

        if (!this.faceUp) {
            card.classList.remove('faceup');
            card.classList.add('facedown');
        }

        return card;
    }

    addCorners(card) {
        const rankSymbols = {
            1: 'A',
            11: 'J',
            12: 'Q',
            13: 'K'
        };

        // Create corners (top-left and bottom-right)
        ['top-left', 'bottom-right'].forEach(position => {
            const corner = document.createElement('div');
            corner.className = `card-corner ${position}`;
            
            const rankText = document.createElement('div');
            rankText.className = 'card-rank';
            rankText.textContent = rankSymbols[this.rank] || this.rank;
            corner.appendChild(rankText);

            const suitSymbol = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            suitSymbol.setAttribute('width', '12');
            suitSymbol.setAttribute('height', '12');
            suitSymbol.setAttribute('viewBox', '0 0 50 50');
            suitSymbol.classList.add('card-suit-small');
            
            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${this.suit}`);
            suitSymbol.appendChild(use);
            corner.appendChild(suitSymbol);
            
            card.appendChild(corner);
        });
    }

    addPips(card) {
        const pipContainer = document.createElement('div');
        pipContainer.className = 'pip-container';
        pipContainer.setAttribute('data-rank', this.rank);
        
        // Pip layout patterns for each rank
        const pipPatterns = {
            1: [[2, 3]],  // Ace (center)
            2: [[1, 1], [3, 5]],  // Two pips
            3: [[2, 1], [2, 3], [2, 5]],  // Three pips
            4: [[1, 1], [3, 1], [1, 5], [3, 5]],  // Four pips
            5: [[1, 1], [3, 1], [2, 3], [1, 5], [3, 5]],  // Five pips
            6: [[1, 1], [3, 1], [1, 3], [3, 3], [1, 5], [3, 5]],  // Six pips
            7: [[1, 1], [3, 1], [1, 3], [2, 3], [3, 3], [1, 5], [3, 5]],  // Seven pips
            8: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 4], [3, 4], [1, 5], [3, 5]],  // Eight pips
            9: [[1, 1], [2, 1], [3, 1], [1, 3], [2, 3], [3, 3], [1, 5], [2, 5], [3, 5]],  // Nine pips
            10: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3], [1, 4], [3, 4], [1, 5], [3, 5]]  // Ten pips
        };

        const positions = pipPatterns[this.rank] || [];
        positions.forEach(([col, row]) => {
            const pip = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            pip.setAttribute('width', '20');
            pip.setAttribute('height', '20');
            pip.setAttribute('viewBox', '0 0 50 50');
            pip.classList.add('card-pip');
            pip.style.gridColumn = col;
            pip.style.gridRow = row;
            
            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${this.suit}`);
            pip.appendChild(use);
            
            pipContainer.appendChild(pip);
        });

        card.appendChild(pipContainer);
    }

    addCourtFigure(card) {
        const courtContainer = document.createElement('div');
        courtContainer.className = 'court-container';
        
        // Create the court figure SVG
        const figure = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        figure.setAttribute('width', '60');
        figure.setAttribute('height', '90');
        figure.setAttribute('viewBox', '0 0 60 90');
        figure.classList.add('court-figure');
        
        // Use the appropriate court figure based on rank
        const courtRanks = {
            11: 'jack',
            12: 'queen',
            13: 'king'
        };
        
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${courtRanks[this.rank]}`);
        figure.appendChild(use);
        
        // Add decorative suit symbols
        const topSuit = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        topSuit.setAttribute('width', '20');
        topSuit.setAttribute('height', '20');
        topSuit.setAttribute('viewBox', '0 0 50 50');
        topSuit.classList.add('court-suit', 'court-suit-top');
        
        const bottomSuit = topSuit.cloneNode(true);
        bottomSuit.classList.remove('court-suit-top');
        bottomSuit.classList.add('court-suit-bottom');
        
        const useTop = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        useTop.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${this.suit}`);
        topSuit.appendChild(useTop);
        
        const useBottom = useTop.cloneNode(true);
        bottomSuit.appendChild(useBottom);
        
        courtContainer.appendChild(topSuit);
        courtContainer.appendChild(figure);
        courtContainer.appendChild(bottomSuit);
        
        card.appendChild(courtContainer);
    }

    flip() {
        this.faceUp = !this.faceUp;
        this.element.classList.toggle('facedown');
        this.element.classList.toggle('faceup');
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
        this.isHandlingClick = false;
        this.isAutoMoving = false;
        this.currentSeed = null;
        this.animationQueue = [];
        this.isAnimating = false;
        window.solitaireGame = this;
        this.setupGame();
    }

    // Seeded random number generator
    seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    // Generate a random seed if none provided
    generateRandomSeed() {
        return Math.floor(Math.random() * 1000000);
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
        // Get seed from input
        const seedInput = document.getElementById('game-seed');
        let seed = seedInput.value.trim();
        
        // Generate new seed if none provided
        if (!seed) {
            seed = this.generateRandomSeed();
            seedInput.value = seed;
        }
        
        this.currentSeed = seed;
        let currentIndex = this.deck.length;
        let seedNumber = Number(seed);

        // Shuffle using Fisher-Yates with seeded random
        while (currentIndex !== 0) {
            const randomIndex = Math.floor(this.seededRandom(seedNumber++) * currentIndex);
            currentIndex--;
            [this.deck[currentIndex], this.deck[randomIndex]] = 
            [this.deck[randomIndex], this.deck[currentIndex]];
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

        // Drag and drop events for all card stacks
        document.querySelectorAll('.card-stack').forEach(stack => {
            stack.addEventListener('dragover', (e) => this.handleDragOver(e));
            stack.addEventListener('drop', (e) => this.handleDrop(e));
            
            // Add double-click handling for all stacks
            stack.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        });

        // Random Game button (previously "New Game")
        document.getElementById('new-game').addEventListener('click', () => {
            // Clear seed input and start new game with random seed
            document.getElementById('game-seed').value = '';
            this.startNewGame();
        });

        // Use Seed button
        document.getElementById('use-seed').addEventListener('click', () => {
            const seedInput = document.getElementById('game-seed');
            const seed = seedInput.value.trim();
            
            // Only start game if there's a seed value
            if (seed) {
                this.startNewGame();
            } else {
                // Optional: provide feedback that seed is required
                seedInput.placeholder = 'Enter a seed first';
                setTimeout(() => {
                    seedInput.placeholder = 'Enter Seed';
                }, 2000);
            }
        });

        // Win message "Play Again" button
        const playAgainBtn = document.querySelector('.win-message button');
        playAgainBtn.onclick = () => {
            // Clear seed and start new random game
            document.getElementById('game-seed').value = '';
            this.startNewGame();
        };
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
            
            // Temporarily set draggingElement for isValidMove check
            this.draggingElement = cardElement;
            this.draggingStack = null;

            if (this.isValidMove(sourceStackId, targetStackId)) {
                // Remove card from source array
                const cardIndex = sourceArray.indexOf(card);
                const [movedCard] = sourceArray.splice(cardIndex, 1);

                // Check if we need to flip a card
                let cardToFlip = null;
                if (sourceStackId.startsWith('tableau-') && sourceArray.length > 0) {
                    const topCard = sourceArray[sourceArray.length - 1];
                    if (!topCard.faceUp) {
                        cardToFlip = topCard;
                    }
                }

                // Queue the animation
                this.isAutoMoving = true;
                this.animationQueue.push({
                    card: movedCard,
                    sourceId: sourceStackId,
                    targetFoundationId: targetStackId,
                    onComplete: () => {
                        // Add card to foundation after animation
                        this.foundations[parseInt(targetStackId.split('-')[1])].push(movedCard);
                        
                        // Flip the exposed card if needed
                        if (cardToFlip) {
                            cardToFlip.flip();
                            // Check for auto-moves after flipping
                            setTimeout(() => {
                                this.isAutoMoving = false;
                                this.checkForAutoMoves();
                            }, 50);
                        }

                        // Check for more auto-moves
                        setTimeout(() => {
                            this.isAutoMoving = false;
                            this.checkForAutoMoves();
                        }, 100);
                    }
                });

                // Start processing the queue if it's not already running
                if (!this.isAnimating) {
                    this.processAnimationQueue();
                }
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
            console.log('Recycling waste back to deck');
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
            const card = this.deck.pop();
            card.flip();
            this.waste.push(card);
            this.updateCardPosition(card, 'waste');
            
            // Check for auto-moves after revealing a new card
            setTimeout(() => this.checkForAutoMoves(), 400);
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
                // Add a class to the target stack to show it's a valid drop target
                target.classList.add('valid-drop-target');
            }
        }
    }

    handleDrop(e) {
        e.preventDefault();
        if (!this.draggingElement) return;

        // Remove valid-drop-target class from all stacks
        document.querySelectorAll('.card-stack').forEach(stack => {
            stack.classList.remove('valid-drop-target');
        });

        // Find the closest card stack, even if we dropped on a card
        const target = e.target.closest('.card-stack');
        if (!target) return;

        const sourceStack = this.findStack(this.draggingElement);
        const targetStack = target.id;

        if (this.isValidMove(sourceStack, targetStack)) {
            this.moveCard(sourceStack, targetStack);
            this.checkWinCondition();
            // Auto-moves will be triggered by moveCard
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

        // Find the moving card - either from draggingElement or cardToMove
        const movingCard = sourceArray.find(card => 
            card.element === (this.draggingElement || card.element)
        );
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
                // Special case: if moving a king, check if the foundation has a queen
                if (movingCard.rank === 13) {
                    return movingCard.suit === topCard.suit && topCard.rank === 12;
                }
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

    moveCard(sourceStackId, targetStackId, cardToMove = null) {
        // Get source and target arrays
        const sourceArray = this.getStackArray(sourceStackId);
        const targetArray = this.getStackArray(targetStackId);
        
        if (!sourceArray || !targetArray) {
            console.warn('Invalid source or target array:', sourceStackId, targetStackId);
            return;
        }

        // Find the card in the source array - use cardToMove if provided, otherwise use draggingElement
        const cardElement = cardToMove ? cardToMove.element : this.draggingElement;
        const cardIndex = sourceArray.findIndex(card => 
            cardToMove ? card === cardToMove : card.element === cardElement
        );
        
        if (cardIndex === -1) {
            console.warn('Card not found in source array:', sourceStackId, cardElement);
            // Debug log the arrays
            console.log('Source array:', sourceArray.map(c => `${c.rank} of ${c.suit}`));
            console.log('Looking for card:', cardToMove || this.draggingElement);
            return;
        }

        let cardsToMove;
        if (this.draggingStack && sourceStackId.startsWith('tableau-')) {
            // Move the whole stack
            cardsToMove = sourceArray.splice(cardIndex);
            console.log('Moving stack:', cardsToMove.map(c => `${c.rank} of ${c.suit}`));
        } else {
            // Move single card
            cardsToMove = [sourceArray.splice(cardIndex, 1)[0]];
            console.log('Moving single card:', cardsToMove[0].rank, 'of', cardsToMove[0].suit);
        }

        // Add cards to target array first
        targetArray.push(...cardsToMove);

        // Then update positions
        cardsToMove.forEach(card => {
            this.updateCardPosition(card, targetStackId);
        });

        // If we exposed a new top card in the source stack, flip it
        if (sourceStackId.startsWith('tableau-') && sourceArray.length > 0) {
            const topCard = sourceArray[sourceArray.length - 1];
            if (!topCard.faceUp) {
                topCard.flip();
                // Check for auto-moves after flipping
                setTimeout(() => {
                    this.isAutoMoving = false;
                    this.checkForAutoMoves();
                }, 50);
            }
        }

        // If this was a foundation move, check for auto-moves and win condition
        if (targetStackId.startsWith('foundation-')) {
            this.checkWinCondition();
            // Check for auto-moves after a short delay
            setTimeout(() => {
                this.isAutoMoving = false;  // Reset auto-moving state
                this.checkForAutoMoves();
            }, 100);
        }
    }

    updateCardPosition(card, stackId) {
        const stack = document.getElementById(stackId);
        if (stack) {
            // Reset all positioning before adding to new stack
            card.element.style.position = '';
            card.element.style.top = '0';
            card.element.style.left = '0';
            
            if (stackId.startsWith('tableau-')) {
                const existingCards = stack.children.length;
                card.element.style.top = `${existingCards * 30}px`;
            }
            
            stack.appendChild(card.element);
            
            // Debug log card movement
            console.log(`Card ${card.rank} of ${card.suit} moved to ${stackId} at position ${stack.children.length}`);
        } else {
            console.warn('Stack not found:', stackId);
        }
    }

    checkWinCondition() {
        // Check if all foundations are complete (13 cards each, with King on top)
        const isComplete = this.foundations.every(foundation => {
            return foundation.length === 13 && 
                   foundation[foundation.length - 1].rank === 13;
        });

        if (isComplete) {
            console.log('Game won! All foundations complete.');
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

    processAnimationQueue() {
        if (this.isAnimating || this.animationQueue.length === 0) return;

        this.isAnimating = true;
        const { card, sourceId, targetFoundationId, onComplete } = this.animationQueue[0];

        // Remove from queue immediately to prevent duplicate processing
        this.animationQueue.shift();

        this.animateCardMove(card, sourceId, targetFoundationId, () => {
            // Call the completion callback
            if (onComplete) {
                onComplete();
            }

            this.isAnimating = false;

            // Small delay before processing next animation
            setTimeout(() => {
                if (this.animationQueue.length > 0) {
                    this.processAnimationQueue();
                } else {
                    // Only check for new moves when queue is empty
                    this.isAutoMoving = false;
                    this.checkForAutoMoves();
                }
            }, 50);
        });
    }

    animateCardMove(card, sourceId, targetFoundationId, onComplete) {
        const cardElement = card.element;
        const targetStack = document.getElementById(targetFoundationId);
        
        // Get the exact position of the card in the page
        const cardRect = cardElement.getBoundingClientRect();
        const targetRect = targetStack.getBoundingClientRect();
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        // Store the original position of the card within its stack
        const originalTop = cardElement.style.top;
        
        // Create a temporary wrapper at the exact card position
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.top = (cardRect.top + scrollY) + 'px';
        wrapper.style.left = (cardRect.left + scrollX) + 'px';
        wrapper.style.width = cardRect.width + 'px';
        wrapper.style.height = cardRect.height + 'px';
        wrapper.style.zIndex = '1000';
        wrapper.style.pointerEvents = 'none';
        
        // Reset the card's position before moving it to the wrapper
        cardElement.style.top = '0';
        cardElement.style.position = 'static';
        
        // Move the card to the wrapper
        wrapper.appendChild(cardElement);
        document.body.appendChild(wrapper);
        
        // Calculate distance for duration, 25% faster than before
        const distance = Math.sqrt(
            Math.pow((targetRect.left + scrollX) - (cardRect.left + scrollX), 2) + 
            Math.pow((targetRect.top + scrollY) - (cardRect.top + scrollY), 2)
        );
        const duration = Math.max(distance * 0.75, 75); // Reduced from 100 to 75 for minimum duration
        
        wrapper.classList.add('moving-to-foundation');
        wrapper.style.transition = `all ${duration}ms linear`;
        
        // Force a reflow
        wrapper.offsetHeight;
        
        // Animate to target position
        wrapper.style.top = (targetRect.top + scrollY) + 'px';
        wrapper.style.left = (targetRect.left + scrollX) + 'px';
        
        // After animation completes
        setTimeout(() => {
            // Remove the wrapper and restore card's original positioning before updating
            wrapper.remove();
            cardElement.style.top = originalTop;
            cardElement.style.position = '';
            this.updateCardPosition(card, targetFoundationId);
            
            if (onComplete) {
                onComplete();
            }
        }, duration);
    }

    checkForAutoMoves() {
        if (this.isAutoMoving || this.isAnimating) {
            console.log('Skipping auto-move check - already moving');
            return;
        }
        
        this.isAutoMoving = true;
        
        // Only check for one move at a time
        // Check waste pile
        if (this.waste.length > 0) {
            const card = this.waste[this.waste.length - 1];
            if (this.tryAutoMoveCard(card, 'waste')) {
                return;
            }
        }
        
        // Check tableau piles
        for (let i = 0; i < this.tableaus.length; i++) {
            const tableau = this.tableaus[i];
            if (tableau.length === 0) continue;
            
            const card = tableau[tableau.length - 1];
            if (!card.faceUp) continue;
            
            if (this.tryAutoMoveCard(card, `tableau-${i}`)) {
                return;
            }
        }

        // If we get here, no moves were found
        this.isAutoMoving = false;
    }

    tryAutoMoveCard(card, sourceId) {
        // Verify card is still in the source array
        const sourceArray = this.getStackArray(sourceId);
        if (!sourceArray || !sourceArray.includes(card)) {
            console.log('Card no longer in source array:', card.rank, 'of', card.suit, 'in', sourceId);
            return false;
        }

        // Find a valid foundation to move to
        let targetFoundationId = null;
        let foundationIndex = -1;

        // Handle aces
        if (card.rank === 1) {
            // Find first empty foundation
            foundationIndex = this.foundations.findIndex(f => f.length === 0);
            if (foundationIndex !== -1) {
                targetFoundationId = `foundation-${foundationIndex}`;
            }
        }
        // Handle twos
        else if (card.rank === 2) {
            // Find foundation with matching ace
            foundationIndex = this.foundations.findIndex(f => 
                f.length === 1 && f[0].suit === card.suit && f[0].rank === 1
            );
            if (foundationIndex !== -1) {
                targetFoundationId = `foundation-${foundationIndex}`;
            }
        }
        // Handle other cards - only if all foundations have at least one card
        else if (this.foundations.every(f => f.length > 0)) {
            // Get the lowest rank among foundation top cards
            const foundationTopRanks = this.foundations.map(f => f[f.length - 1].rank);
            const lowestFoundationRank = Math.min(...foundationTopRanks);
            
            // Only allow auto-move if card rank is at most 1 higher than lowest foundation rank
            if (card.rank <= lowestFoundationRank + 1) {
                // Find foundation with matching suit and previous rank
                foundationIndex = this.foundations.findIndex(f => {
                    const topCard = f[f.length - 1];
                    if (card.rank === 13) {
                        return topCard.suit === card.suit && topCard.rank === 12;
                    }
                    return topCard.suit === card.suit && topCard.rank === card.rank - 1;
                });
                if (foundationIndex !== -1) {
                    targetFoundationId = `foundation-${foundationIndex}`;
                }
            }
        }

        // If we found a valid foundation, queue the move
        if (targetFoundationId) {
            console.log('Queueing auto-move:', `${card.rank} of ${card.suit} from ${sourceId} to ${targetFoundationId}`);
            
            // Remove card from source array before queueing animation
            const cardIndex = sourceArray.indexOf(card);
            const [movedCard] = sourceArray.splice(cardIndex, 1);
            
            // Check if we need to flip a card
            let cardToFlip = null;
            if (sourceId.startsWith('tableau-') && sourceArray.length > 0) {
                const topCard = sourceArray[sourceArray.length - 1];
                if (!topCard.faceUp) {
                    cardToFlip = topCard;
                }
            }

            // Queue the animation
            this.animationQueue.push({
                card: movedCard,
                sourceId,
                targetFoundationId,
                onComplete: () => {
                    // Add card to foundation after animation
                    this.foundations[foundationIndex].push(movedCard);
                    console.log('Move completed:', `${movedCard.rank} of ${movedCard.suit} to foundation ${foundationIndex}`);
                    
                    // Flip the exposed card if needed
                    if (cardToFlip) {
                        cardToFlip.flip();
                    }

                    // Check win condition after adding card to foundation
                    this.checkWinCondition();
                }
            });
            
            // Start processing the queue if it's not already running
            if (!this.isAnimating) {
                this.processAnimationQueue();
            }
            
            return true;
        }
        
        return false;
    }
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    // Start the game immediately since SVGs are inline
    window.game = new Solitaire();
}); 