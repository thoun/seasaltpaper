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
            description: clienttranslate('${actplayer} must choose a card to keep'),
            descriptionMyTurn: clienttranslate('${you} must choose a card to keep'),
            transitions: [
                "putDiscardPile" => ST_PLAYER_PUT_DISCARD_PILE,
                "playCards" => ST_PLAYER_ANGELFISH_POWER,
                "zombiePass" => ST_NEXT_PLAYER,
            ],
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
            $this->gamestate->nextState('playCards');
            return;
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

            $this->gamestate->nextState('playCards');
        } else {
            $remainingCardsInDiscard1 = $this->game->cards->countItemsInLocation('discard1');
            $remainingCardsInDiscard2 = $this->game->cards->countItemsInLocation('discard2');

            if ($remainingCardsInDiscard1 == 0) {
                $this->game->applyPutDiscardPile(1);
                $this->gamestate->nextState('playCards');
            } else if ($remainingCardsInDiscard2 == 0) {
                $this->game->applyPutDiscardPile(2);
                $this->gamestate->nextState('playCards');
            } else {
                $this->gamestate->nextState('putDiscardPile');
            }
        }
    }

    function zombie(int $playerId) {
    	return 'zombiePass';
    }
}