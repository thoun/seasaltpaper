<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\SeaSaltPaper\Game;
use Bga\Games\SeaSaltPaper\Objects\Card;

class TakeCards extends GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_PLAYER_TAKE_CARDS,
            type: StateType::ACTIVE_PLAYER,
            name: 'takeCards',
            description: clienttranslate('${actplayer} must take two cards from deck or one card from a discard pile ${call}'),
            descriptionMyTurn: clienttranslate('${you} must take two cards from deck or one card from a discard pile ${call}'),
            updateGameProgression: true,
        );
    }

    function getArgs() {
        $forceTakeOne = intval($this->game->getGameStateValue(FORCE_TAKE_ONE)) > 0;

        $canTakeFromDeck = $this->game->cards->countItemsInLocation('deck') > 0;
        $canTakeFromDiscard = [];
        foreach([1, 2] as $discardNumber) {
            if ($this->game->cards->countItemsInLocation('discard'.$discardNumber) > 0) {
                $canTakeFromDiscard[] = $discardNumber;
            }
        }
        $endRound = intval($this->game->getGameStateValue(END_ROUND_TYPE));
    
        return [
            'forceTakeOne' => $forceTakeOne,
            'canTakeFromDeck' => !$forceTakeOne && $canTakeFromDeck,
            'canTakeFromDiscard' => $forceTakeOne ? [] : $canTakeFromDiscard,
            'call' => in_array($endRound, [LAST_CHANCE, STOP]) ? $this->game->ANNOUNCEMENTS[$endRound] : '',
        ];
    }

    #[PossibleAction]
    public function actTakeCardsFromDeck(int $activePlayerId) {        
        $args = $this->getArgs($activePlayerId);

        if ($args['forceTakeOne']) {
            return $this->takeFirstCardFromDeck($activePlayerId);
        }

        if (!$args['canTakeFromDeck']) {
            throw new \BgaUserException("You can't take a card from the deck");
        }

        $cards = $this->game->cards->pickItemsForLocation(2, 'deck', null, 'pick');

        $this->game->notify->all('log', clienttranslate('${player_name} picks ${number} cards from the deck'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerNameById($activePlayerId),
            'number' => count($cards),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $activePlayerId,
        ]);

        $this->game->incStat(1, 'takeCardFromDeck');
        $this->game->incStat(1, 'takeCardFromDeck', $activePlayerId);

        return ChooseCard::class;
    }

    #[PossibleAction]
    public function actTakeCardFromDiscard(int $discardNumber, int $activePlayerId) {       

        $args = $this->getArgs($activePlayerId);        
        
        if (!in_array($discardNumber, $args['canTakeFromDiscard'])) {
            throw new \BgaUserException("You can't take a card from the discard pile");
        }

        $card = $this->game->cards->getDiscardTopCard($discardNumber);
        if ($card == null) {
            throw new \BgaUserException("No card in that discard");
        }

        $this->game->cards->moveItem($card, 'hand'.$activePlayerId);
        $this->game->cardCollected($activePlayerId, $card);

        $this->game->notify->all('cardInHandFromDiscard', clienttranslate('${player_name} takes ${cardColor} ${cardName} from discard pile ${discardNumber}'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerNameById($activePlayerId),
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

        $this->game->incStat(1, 'takeFromDiscard');
        $this->game->incStat(1, 'takeFromDiscard', $activePlayerId);

        $this->game->updateCardsPoints($activePlayerId);
        return AngelfishPower::class;
    }

    function zombie(int $playerId) {
        $args = $this->getArgs();
        $fromDeck = true;
        if ($args['canTakeFromDeck'] && count($args['canTakeFromDiscard']) > 0) {
            $fromDeck = bga_rand(1, 3) < 3;
        } else if (!$args['canTakeFromDeck']) {
            $fromDeck = false;
        }

        if ($fromDeck) {
            return $this->actTakeCardsFromDeck($playerId);
        } else {
            $possibleMoves = $args['canTakeFromDiscard'];
            $zombieChoice = $possibleMoves[bga_rand(0, count($possibleMoves) - 1)]; // random choice over possible moves
            return $this->actTakeCardFromDiscard($zombieChoice, $playerId);
        }
    }

    public function takeFirstCardFromDeck(int $playerId) {
        if (intval($this->game->cards->countItemsInLocation('deck')) > 0) {
            $card = $this->game->cards->pickItemForLocation('deck', null, 'hand'.$playerId);
            $this->game->cardCollected($playerId, $card);

            $this->notify->player($playerId, 'cardInHandFromDeck', clienttranslate('You take ${cardColor} ${cardName} card from deck'), [
                'playerId' => $playerId,
                'player_name' => $this->game->getPlayerNameById($playerId),
                'card' => $card,
                'cardName' => $this->game->getCardName($card),
                'cardColor' => $this->game->COLORS[$card->color],
                'i18n' => ['cardName', 'cardColor'],
                'preserve' => ['actionPlayerId'],
                'actionPlayerId' => $playerId,
                'deckTopCard' => $this->game->cards->getDeckTopCard(),
                'remainingCardsInDeck' => $this->game->getRemainingCardsInDeck(),
            ]);
            $this->notify->all('cardInHandFromDeck', clienttranslate('${player_name} took a card from deck'), [
                'playerId' => $playerId,
                'player_name' => $this->game->getPlayerNameById($playerId),
                'card' => Card::onlyId($card),
                'preserve' => ['actionPlayerId'],
                'actionPlayerId' => $playerId,
                'deckTopCard' => $this->game->cards->getDeckTopCard(),
                'remainingCardsInDeck' => $this->game->getRemainingCardsInDeck(),
            ]);

            $this->game->updateCardsPoints($playerId);
        }

        return NextPlayer::class;
    }
}