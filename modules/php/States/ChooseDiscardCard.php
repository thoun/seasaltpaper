<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\SeaSaltPaper\Game;
use Bga\Games\SeaSaltPaper\Objects\Card;
use Bga\Games\SeaSaltPaper\Objects\CardsPoints;

class ChooseDiscardCard extends GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_PLAYER_CHOOSE_DISCARD_CARD,
            type: StateType::ACTIVE_PLAYER,
            name: 'chooseDiscardCard',
            description: clienttranslate('${actplayer} must choose a card'),
            descriptionMyTurn: clienttranslate('${you} must choose a card'),
        );
    }

    function getDiscardCards(): array {
        $discardNumber = $this->globals->get(THE_HERMIT_CRAB_CURRENT_PILE) ?? $this->game->getGameStateValue(CHOSEN_DISCARD);
        $cards = $this->game->cards->getItemsInLocation('discard'.$discardNumber);
        usort($cards, fn($a, $b) => $a->locationArg <=> $b->locationArg);
        return $cards;
    }

    function getArgs(int $activePlayerId) {
        $discardNumber = $this->globals->get(THE_HERMIT_CRAB_CURRENT_PILE) ?? $this->game->getGameStateValue(CHOSEN_DISCARD);
        $cards = $this->getDiscardCards();
        $maskedCards = Card::onlyIds($cards);
    
        return [
            'discardNumber' => $discardNumber,
            '_private' => [
                $activePlayerId => [
                    'cards' => $cards,
                ]
            ],
            'cards' => $maskedCards,
        ];
    }

    #[PossibleAction]
    public function actChooseDiscardCard(int $id, int $activePlayerId) {

        $card = $this->game->cards->getItemById($id);
        $hermitCrabCurrentPile = $this->game->globals->get(THE_HERMIT_CRAB_CURRENT_PILE);
        $discardNumber = $hermitCrabCurrentPile ?? $this->game->getGameStateValue(CHOSEN_DISCARD);
        if ($card == null || $card->location != 'discard'.$discardNumber) {
            throw new \BgaUserException("Invalid discard card");
        }

        $this->game->cards->moveItem($card, 'hand'.$activePlayerId);
        $this->game->cardCollected($activePlayerId, $card);

        $this->game->notify->player($activePlayerId, 'cardInHandFromDiscardCrab', clienttranslate('You take ${cardColor} ${cardName} from discard pile ${discardNumber}'), [
            'playerId' => $activePlayerId,
            'card' => $card,
            'cardName' => $this->game->getCardName($card),
            'cardColor' => $this->game->COLORS[$card->color],
            'i18n' => ['cardName', 'cardColor'],
            'discardId' => $discardNumber,
            'discardNumber' => $discardNumber,
            'newDiscardTopCard' => $this->game->cards->getDiscardTopCard($discardNumber),
            'remainingCardsInDiscard' => $this->game->getRemainingCardsInDiscard($discardNumber),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $activePlayerId,
        ]);
        $this->game->notify->all('cardInHandFromDiscardCrab', clienttranslate('${player_name} takes a card from discard pile ${discardNumber}'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerNameById($activePlayerId),
            'card' => Card::onlyId($card),
            'discardId' => $discardNumber,
            'discardNumber' => $discardNumber,
            'newDiscardTopCard' => $this->game->cards->getDiscardTopCard($discardNumber),
            'remainingCardsInDiscard' => $this->game->getRemainingCardsInDiscard($discardNumber),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $activePlayerId,
        ]);

        $this->game->updateCardsPoints($activePlayerId);

        if ($hermitCrabCurrentPile === 1) {
            $hermitCrabCurrentPile = $this->game->cards->countItemsInLocation('discard2') > 0 ? 2 : null;
            $this->game->globals->set(THE_HERMIT_CRAB_CURRENT_PILE, $hermitCrabCurrentPile);
        } else if ($hermitCrabCurrentPile === 2) {
            $hermitCrabCurrentPile = null;
            $this->game->globals->set(THE_HERMIT_CRAB_CURRENT_PILE, $hermitCrabCurrentPile);
        }

        if ($hermitCrabCurrentPile === null) {
            return PlayCards::class;
        } else {
            return ChooseDiscardCard::class;
        }
    }

    function zombie(int $playerId) {
        $cards = $this->getDiscardCards();

        $tableCards = $this->game->getPlayerCards($playerId, 'table', false);
        $handCards = $this->game->getPlayerCards($playerId, 'hand', false);

        $possibleAnswerPoints = [];
        foreach ($cards as $card) {
            $possibleAnswerPoints[$card->id] = (new CardsPoints($tableCards, array_merge($handCards, [$card]), $this->game->eventCards->getPlayerEffects($playerId)))->totalPoints;
        }

        $zombieChoice = $this->getBestZombieChoice($possibleAnswerPoints); // get top choice over possible moves
    	return $this->actChooseDiscardCard($zombieChoice, $playerId);
    }
}