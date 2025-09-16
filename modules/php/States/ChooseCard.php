<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\SeaSaltPaper\Game;
use Bga\Games\SeaSaltPaper\Objects\Card;

class ChooseCard extends GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_PLAYER_CHOOSE_CARD,
            type: StateType::ACTIVE_PLAYER,
            name: 'chooseCard',
            description: clienttranslate('${actplayer} must choose a card to keep'),
            descriptionMyTurn: clienttranslate('${you} must choose a card to keep'),
        );
    }

    function getArgs(int $activePlayerId) { 
        $cards = $this->game->cards->getItemsInLocation('pick');
        $maskedCards = Card::onlyIds($cards);
    
        return [
            '_private' => [
                $activePlayerId => [
                    'cards' => $cards,
                ]
            ],
            'cards' => $maskedCards,
            'deckTopCard' => $this->game->cards->getDeckTopCard(),
            'remainingCardsInDeck' => $this->game->getRemainingCardsInDeck(),
        ];
    }

    #[PossibleAction]
    public function actChooseCard(int $id, int $activePlayerId) {
        $card = $this->game->cards->getItemById($id);
        if ($card->location != 'pick') {
            throw new \BgaUserException("Cannot pick this card");
        }

        $this->game->cards->moveItem($card, 'hand'.$activePlayerId);
        $this->game->cardCollected($activePlayerId, $card);

        $this->notify->player($activePlayerId, 'cardInHandFromPick', clienttranslate('You choose ${cardColor} ${cardName} card'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerNameById($activePlayerId),
            'card' => $card,
            'cardName' => $this->game->getCardName($card),
            'cardColor' => $this->game->COLORS[$card->color],
            'i18n' => ['cardName', 'cardColor'],
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $activePlayerId,
        ]);
        $this->notify->all('cardInHandFromPick', clienttranslate('${player_name} chooses a card'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerNameById($activePlayerId),
            'card' => Card::onlyId($card),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $activePlayerId,
        ]);

        $this->game->updateCardsPoints($activePlayerId);
        
        $remainingCardsInPick = $this->game->cards->countItemsInLocation('pick');
        if ($remainingCardsInPick == 0) {
            return PlayCards::class;
        }

        if (boolval($this->game->getGameStateValue(LOBSTER_POWER))) {
            $this->game->setGameStateValue(LOBSTER_POWER, 0);

            $cards = $this->game->cards->getItemsInLocation('pick');
            if (count($cards) > 0) {
                $this->game->cards->moveAllItemsInLocation('pick', 'deck');
                $this->game->cards->shuffle('deck');

                $this->notify->all('cardsInDeckFromPick', '', [
                    'playerId' => $activePlayerId,
                    'player_name' => $this->game->getPlayerNameById($activePlayerId),
                    'cards' => $cards,
                    'deckTopCard' => $this->game->cards->getDeckTopCard(),
                    'remainingCardsInDeck' => $this->game->getRemainingCardsInDeck(),
                    'preserve' => ['actionPlayerId'],
                    'actionPlayerId' => $activePlayerId,
                ]);

                $this->notify->all('reshuffleDeck', '', [
                    'deckTopCard' => $this->game->cards->getDeckTopCard(),
                ]);
            }

            return PlayCards::class;
        } else {
            $remainingCardsInDiscard1 = $this->game->cards->countItemsInLocation('discard1');
            $remainingCardsInDiscard2 = $this->game->cards->countItemsInLocation('discard2');

            if ($remainingCardsInDiscard1 == 0) {
                $this->game->applyPutDiscardPile(1);
                return PlayCards::class;
            } else if ($remainingCardsInDiscard2 == 0) {
                $this->game->applyPutDiscardPile(2);
                return PlayCards::class;
            } else {
                return PutDiscardPile::class;
            }
        }
    }

    function zombie(int $playerId) {
        $cards = $this->game->cards->getItemsInLocation('pick');
        $zombieChoice = $cards[bga_rand(0, count($cards) - 1)]; // random choice over possible moves
    	return $this->actChooseCard($zombieChoice->id, $playerId);
    }
}