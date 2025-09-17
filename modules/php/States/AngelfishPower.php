<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\SeaSaltPaper\Game;
use Bga\Games\SeaSaltPaper\Objects\CardsPoints;

use const Bga\Games\SeaSaltPaper\THE_ANGELFISH;

class AngelfishPower extends GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_PLAYER_ANGELFISH_POWER,
            type: StateType::ACTIVE_PLAYER,
            name: 'angelfishPower',
            description: clienttranslate('${actplayer} must take one card from the discard (The Angelfish)'),
            descriptionMyTurn: clienttranslate('${you} must take one card from the discard (The Angelfish)'),
        );
    }

    function getArgs(int $activePlayerId) {
        $canPlay = false;
        if ($this->game->eventCards->playerHasEffect($activePlayerId, THE_ANGELFISH)) {
            $cardInDiscard1 = $this->game->cards->getOnTop('discard1');
            $cardInDiscard2 = $this->game->cards->getOnTop('discard2');

            $canPlay = $cardInDiscard1 !== null && $cardInDiscard2 !== null && $cardInDiscard1->color === $cardInDiscard2->color;
        }

        return [
            '_no_notify' => !$canPlay,
        ];
    }

    function onEnteringState(array $args) {
        if ($args['_no_notify']) {
            return PlayCards::class;
        }
    }

    #[PossibleAction]
    public function actTakeCardAngelfishPower(int $number, int $activePlayerId) {
        $card = $this->game->cards->getDiscardTopCard($number);
        if ($card == null) {
            throw new \BgaUserException("No card in that discard");
        }

        $this->game->cards->moveItem($card, 'hand'.$activePlayerId);
        $this->game->cardCollected($activePlayerId, $card);

        $this->notify->all('cardInHandFromDiscard', clienttranslate('${player_name} takes ${cardColor} ${cardName} from discard pile ${discardNumber} (The angelfish power)'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerNameById($activePlayerId),
            'card' => $card,
            'cardName' => $this->game->getCardName($card),
            'cardColor' => $this->game->COLORS[$card->color],
            'i18n' => ['cardName', 'cardColor'],
            'discardId' => $number,
            'discardNumber' => $number,
            'newDiscardTopCard' => $this->game->cards->getDiscardTopCard($number),
            'remainingCardsInDiscard' => $this->game->getRemainingCardsInDiscard($number),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $activePlayerId,
        ]);

        $this->game->updateCardsPoints($activePlayerId);
        return PlayCards::class;
    }

    function zombie(int $playerId) {
        $cardsInDiscard = [
            1 => $this->game->cards->getOnTop('discard1'),
            2 => $this->game->cards->getOnTop('discard2'),
        ];

        $tableCards = $this->game->getPlayerCards($playerId, 'table', false);
        $handCards = $this->game->getPlayerCards($playerId, 'hand', false);

        $possibleAnswerPoints = [];
        foreach ($cardsInDiscard as $choice => $card) {
            $possibleAnswerPoints[$choice] = (new CardsPoints($tableCards, array_merge($handCards, [$card]), $this->game->eventCards->getPlayerEffects($playerId)))->totalPoints;
        }

        $zombieChoice = $this->getBestZombieChoice($possibleAnswerPoints); // get top choice over possible moves
    	return $this->actTakeCardAngelfishPower($zombieChoice, $playerId);
    }
}