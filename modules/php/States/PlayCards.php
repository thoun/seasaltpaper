<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\Actions\CheckAction;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\SeaSaltPaper\Game;

use const Bga\Games\SeaSaltPaper\THE_CORAL_REEF;
use const Bga\Games\SeaSaltPaper\THE_DIODON_FISH;
use const Bga\Games\SeaSaltPaper\THE_HERMIT_CRAB;
use const Bga\Games\SeaSaltPaper\THE_SUNFISH;

class PlayCards extends GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_PLAYER_PLAY_CARDS,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate('${actplayer} may play cards duo'),
            descriptionMyTurn: clienttranslate('${you} may play cards duo'),
            updateGameProgression: true,
            transitions: [
                "chooseDiscardPile" => ST_PLAYER_CHOOSE_DISCARD_PILE,
                "newTurn" => ST_PLAYER_TAKE_CARDS,
                "chooseOpponent" => ST_PLAYER_CHOOSE_OPPONENT,
                "chooseOpponentForSwap" => ST_PLAYER_CHOOSE_OPPONENT_FOR_SWAP,
                "chooseCard" => ST_PLAYER_CHOOSE_CARD,
                "playCards" => ST_PLAYER_PLAY_CARDS,
                "placeShellFaceDown" => ST_PLAYER_PLACE_SHELL_FACE_DOWN,
                "pickFromDiscardPiles" => ST_PLAYER_CHOOSE_DISCARD_CARD,
                "stealPlayedPair" => ST_PLAYER_STEAL_PLAYED_PAIR,
                "endTurn" => ST_NEXT_PLAYER,
                "mermaids" => ST_END_SCORE,
                "zombiePass" => ST_NEXT_PLAYER,
            ],
        );
    }

    function getArgs(int $activePlayerId) {

        $totalPoints = $this->game->getCardsPoints($activePlayerId)->totalPoints;
        $playableDuoCards = $this->game->playableDuoCards($activePlayerId); // TODO remove
        $possiblePairs = $this->game->getPossiblePairs($activePlayerId);
        $canCallEndRound = $totalPoints >= $this->game->pointsToEndRound($activePlayerId) && intval($this->game->getGameStateValue(END_ROUND_TYPE)) == 0;
        $canStop = $canCallEndRound && !$this->game->eventCards->playerHasEffect($activePlayerId, THE_DIODON_FISH);
        $mermaidsToEndGame = $this->game->mermaidsToEndGame($activePlayerId);
        $hasFourMermaids = count($this->game->getPlayerMermaids($activePlayerId)) == $mermaidsToEndGame;
        $canShield = $this->game->eventCards->playerHasEffect($activePlayerId, THE_CORAL_REEF) && !$this->game->isProtected($activePlayerId) && Arrays::some($this->game->getPlayerCards($activePlayerId, 'hand', false), fn($card) => $card->category === COLLECTION && $card->family === SHELL);
    
        return [
            'canDoAction' => count($possiblePairs) > 0 || $canCallEndRound || $hasFourMermaids || $canShield,
            'playableDuoCards' => $playableDuoCards, // TODO remove
            'possiblePairs' => $possiblePairs,
            'hasFourMermaids' => $hasFourMermaids,
            'mermaidsToEndGame' => $mermaidsToEndGame,
            'canCallEndRound' => $canCallEndRound,
            'canStop' => $canStop,
            'canShield' => $canShield,
        ];
    }

    function onEnteringState(int $activePlayerId) {
        /*$mermaids = $this->getPlayerMermaids($activePlayerId);
        if (count($mermaids) == $this->mermaidsToEndGame($activePlayerId)) {
            $this->endGameWithMermaids($activePlayerId);
        }*/
    }

    #[PossibleAction]
    public function actPlayCards(int $id1, int $id2, int $activePlayerId) {
        if ($id1 == $id2) {
            throw new \BgaUserException("Same id");
        }

        $cards = $this->game->cards->getItemsByIds([$id1, $id2]);

        if (Arrays::some($cards, fn($card) => $card->location != 'hand'.$activePlayerId || $card->category != PAIR)) {
            throw new \BgaUserException("You must select Pair cards from your hand");
        }

        $possiblePairs = $this->game->getPossiblePairs($activePlayerId);
        if (!Arrays::some($possiblePairs, 
            fn($possiblePair) => ($cards[0]->family == $possiblePair[0] && $cards[1]->family == $possiblePair[1]) || ($cards[1]->family == $possiblePair[0] && $cards[0]->family == $possiblePair[1])
        )) {
            throw new \BgaUserException("Invalid pair");
        }

        $count = $this->game->cards->countItemsInLocation('table'.$activePlayerId);
        foreach($cards as &$card) {
            $card->location = 'table'.$activePlayerId;
            $card->locationArg = ++$count;
            $this->game->cards->moveItem($card, $card->location, $card->locationArg);
        }

        $families = array_map(fn($card) => $card->family, $cards);
        sort($families);
        $action = '';
        $power = 0;
        switch ($families[0]) {
            case CRAB:
                if ($families[1] == LOBSTER) {
                    $action = clienttranslate('takes the first five cards from the deck and keeps one of them');
                    $power = 6;
                } else {
                    $action = clienttranslate('takes a card from a discard pile');
                    $power = 1;
                }
                break;
            case BOAT:
                $action = clienttranslate('plays a new turn');
                $power = 2;
                break;
            case FISH:
                $action = clienttranslate('adds the top card from the deck to hand');
                $power = 3;
                break;
            case SWIMMER:
            case SHARK:
                if ($families[0] == SWIMMER && $families[1] == JELLYFISH) {
                    $action = clienttranslate('forces the opposing players to only draw the first card from the deck on their next turn');
                    $power = 5;
                } else if ($families[0] == SWIMMER && $families[1] == SWIMMER) {
                    $action = clienttranslate('swap a card with one from the hand of another player');
                    $power = 7;
                } else if ($families[0] == SHARK && $families[1] == SHARK) {
                    $action = clienttranslate('steals a pair placed in front of an opponent');
                    $power = 8;
                } else {
                    $action = clienttranslate('steals a random card from another player');
                    $power = 4;
                }
                break;
        }

        $this->notify->all('playCards', clienttranslate('${player_name} plays cards ${cardColor1} ${cardName1} and ${cardColor2} ${cardName2} and ${action}'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerNameById($activePlayerId),
            'cards' => $cards,
            'cardName1' => $this->game->getCardName($cards[0]),
            'cardName2' => $this->game->getCardName($cards[1]),
            'cardColor1' => $this->game->COLORS[$cards[0]->color],
            'cardColor2' => $this->game->COLORS[$cards[1]->color],
            'action' => $action,
            'i18n' => ['cardName1', 'cardName2', 'cardColor1', 'cardColor2', 'action'],
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $activePlayerId,
        ]);

        $this->game->incStat(1, 'playedDuoCards');
        $this->game->incStat(1, 'playedDuoCards', $activePlayerId);
        $this->game->incStat(1, 'playedDuoCards'.$power);
        $this->game->incStat(1, 'playedDuoCards'.$power, $activePlayerId);

        switch ($power) {
            case 1:
                if (($this->game->cards->countItemsInLocation('discard1') + $this->game->cards->countItemsInLocation('discard2')) > 0) {
                    if ($this->game->eventCards->playerHasEffect($activePlayerId, THE_HERMIT_CRAB)) {
                        $this->globals->set(THE_HERMIT_CRAB_CURRENT_PILE, $this->game->cards->countItemsInLocation('discard1') > 0 ? 1 : 2);
                        $this->gamestate->nextState('pickFromDiscardPiles');
                    } else {
                        $this->gamestate->nextState('chooseDiscardPile');
                    }
                } else {
                    $this->notify->all('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    $this->gamestate->nextState('playCards');
                }
                break;
            case 2:
                if (($this->game->cards->countItemsInLocation('deck') + $this->game->cards->countItemsInLocation('discard1') + $this->game->cards->countItemsInLocation('discard2')) > 0) {
                    $this->gamestate->nextState('newTurn');
                } else {
                    $this->notify->all('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    $this->gamestate->nextState('playCards');
                }
                break;
            case 3:
                if (!$this->game->pickTopCardFromDeck($activePlayerId)) {
                    $this->notify->all('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                } else {
                    if ($this->game->eventCards->playerHasEffect($activePlayerId, THE_SUNFISH)) {
                        $this->notify->all('log', clienttranslate('${player_name} played a pair of fish and apply The Sunfish effect'), [
                            'playerId' => $activePlayerId,
                            'player_name' => $this->game->getPlayerNameById($activePlayerId),
                        ]);

                        if (!$this->game->pickTopCardFromDeck($activePlayerId)) {
                            $this->notify->all('log', clienttranslate('Impossible to activate The Sunfish effect, it is ignored'), []);
                        }
                    }
                }
                $this->gamestate->nextState('playCards');
                break;
            case 4:
                $possibleOpponentsToSteal = $this->game->getPossibleOpponentsToSteal($activePlayerId);

                if (count($possibleOpponentsToSteal) > 0) {
                    $this->globals->set(CAN_CHOOSE_CARD_TO_STEAL, false);
                    $this->gamestate->nextState('chooseOpponent');
                } else {
                    $this->notify->all('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    $this->gamestate->nextState('playCards');
                }

                /*if (count($possibleOpponentsToSteal) > 1) {
                    $this->gamestate->nextState('chooseOpponent');
                } else {
                    if (count($possibleOpponentsToSteal) == 1) {
                        $this->applyStealRandomCard($playerId, $possibleOpponentsToSteal[0]);
                    } else {
                        $this->notify->all('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    }
                    $this->gamestate->nextState('playCards');
                }*/
                break;
            case 5:
                $this->game->setGameStateValue(FORCE_TAKE_ONE, $activePlayerId);
                $this->gamestate->nextState('playCards');
                break;
            case 6:
                if ($this->game->cards->countItemsInLocation('deck') > 0) {
                    $this->game->setGameStateValue(LOBSTER_POWER, 1);

                    $cards = $this->game->cards->pickItemsForLocation(5, 'deck', null, 'pick');
            
                    $this->notify->all('log', clienttranslate('${player_name} picks ${number} cards from the deck'), [
                        'playerId' => $activePlayerId,
                        'player_name' => $this->game->getPlayerNameById($activePlayerId),
                        'number' => count($cards),
                        'preserve' => ['actionPlayerId'],
                        'actionPlayerId' => $activePlayerId,
                    ]);

                    $this->gamestate->nextState('chooseCard');
                } else {
                    $this->notify->all('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    $this->gamestate->nextState('playCards');
                }
                break;
            case 7:
                $possibleOpponentsToSteal = $this->game->getPossibleOpponentsToSteal($activePlayerId);

                if (count($possibleOpponentsToSteal) > 0) {
                    $this->globals->set(CAN_CHOOSE_CARD_TO_STEAL, true);
                    $this->gamestate->nextState('chooseOpponentForSwap');
                } else {
                    $this->notify->all('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    $this->gamestate->nextState('playCards');
                }
                break;
            case 8:
                $possibleOpponentsToSteal = $this->game->getPossibleOpponentsToStealFromTable($activePlayerId);

                if (count($possibleOpponentsToSteal) > 0) {
                    $this->gamestate->nextState('stealPlayedPair');
                } else {
                    $this->notify->all('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    $this->gamestate->nextState('playCards');
                }
                break;
        }
    }

    #[PossibleAction]
    public function actPlayCardsTrio(int $id1, int $id2, int $starfishId, int $activePlayerId) {
        if ($id1 == $id2) {
            throw new \BgaUserException("Same id");
        }

        $cards = $this->game->cards->getItemsByIds([$id1, $id2]);

        if (Arrays::some($cards, fn($card) => $card->location != 'hand'.$activePlayerId || $card->category != PAIR)) {
            throw new \BgaUserException("You must select Pair cards from your hand");
        }

        if (!in_array($cards[1]->family, $cards[0]->matchFamilies)) {
            throw new \BgaUserException("Invalid pair");
        }

        $starfishCard = $this->game->cards->getItemById($starfishId);
        if ($starfishCard->location != 'hand'.$activePlayerId || $starfishCard->category != SPECIAL || $starfishCard->family != STARFISH) {
            throw new \BgaUserException("You must select a Starfish card from your hand");
        }

        $allCards = array_merge($cards, [$starfishCard]);

        $count = $this->game->cards->countItemsInLocation('table'.$activePlayerId);
        foreach($allCards as &$card) {
            $card->location = 'table'.$activePlayerId;
            $card->locationArg = ++$count;
            $this->game->cards->moveItem($card, $card->location, $card->locationArg);
        }

        $this->notify->all('playCards', clienttranslate('${player_name} plays cards ${cardColor1} ${cardName1} and ${cardColor2} ${cardName2} with a ${cardColor3} ${cardName3}'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerNameById($activePlayerId),
            'cards' => $allCards,
            'cardName1' => $this->game->getCardName($cards[0]),
            'cardName2' => $this->game->getCardName($cards[1]),
            'cardName3' => $this->game->getCardName($starfishCard),
            'cardColor1' => $this->game->COLORS[$cards[0]->color],
            'cardColor2' => $this->game->COLORS[$cards[1]->color],
            'cardColor3' => $this->game->COLORS[$starfishCard->color],
            'i18n' => ['cardName1', 'cardName2', 'cardName3', 'cardColor1', 'cardColor2', 'cardColor3'],
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $activePlayerId,
        ]);

        $this->game->updateCardsPoints($activePlayerId);

        /*$this->incStat(1, 'playedDuoCards');
        $this->incStat(1, 'playedDuoCards', $playerId);*/ 
        
        return 'playCards';
    }

    #[PossibleAction]
    #[CheckAction(false)]
    public function actEndGameWithMermaids(int $activePlayerId) {
        $this->endGameWithMermaids($activePlayerId);
    }

    #[PossibleAction]
    public function actSelectShellFaceDown(int $activePlayerId) {
        return 'placeShellFaceDown';
    }

    #[PossibleAction]
    public function actEndTurn(int $activePlayerId) {
        $mermaids = $this->game->getPlayerMermaids($activePlayerId);
        if (count($mermaids) == $this->game->mermaidsToEndGame($activePlayerId)) {
            $this->endGameWithMermaids($activePlayerId);
            return;
        }
        
        return 'endTurn';
    }

    #[PossibleAction]
    public function actEndRound(int $activePlayerId) {
        $this->game->incStat(1, 'announce');
        $this->game->incStat(1, 'announce', $activePlayerId);
        $this->game->incStat(1, 'announceLastChance');
        $this->game->incStat(1, 'announceLastChance', $activePlayerId);

        $this->applyEndRound(LAST_CHANCE, $this->game->ANNOUNCEMENTS[LAST_CHANCE], $activePlayerId);
    }

    #[PossibleAction]
    public function actImmediateEndRound(int $activePlayerId) {
        $this->game->incStat(1, 'announce');
        $this->game->incStat(1, 'announce', $activePlayerId);
        $this->game->incStat(1, 'announceStop');
        $this->game->incStat(1, 'announceStop', $activePlayerId);

        $this->game->setGameStateValue(STOP_CALLER, $activePlayerId);

        $this->applyEndRound(STOP, $this->game->ANNOUNCEMENTS[STOP], $activePlayerId);
    }

    function zombie(int $playerId) {
    	return 'zombiePass';
    }

    public function applyEndRound(int $type, string $announcement, int $activePlayerId) {
        $mermaids = $this->game->getPlayerMermaids($activePlayerId);
        if (count($mermaids) == $this->game->mermaidsToEndGame($activePlayerId)) {
            $this->endGameWithMermaids($activePlayerId);
            return;
        }

        $this->game->setGameStateValue(END_ROUND_TYPE, $type);

        $this->notify->all('announceEndRound', clienttranslate('${player_name} announces ${announcement}!'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerNameById($activePlayerId),
            'announcement' => $announcement,
            'i18n' => ['announcement'],
        ]);
        
        $this->gamestate->nextState('endTurn');
    }

    public function endGameWithMermaids(int $playerId) {
        $mermaids = $this->game->getPlayerMermaids($playerId);
        if (count($mermaids) == $this->game->mermaidsToEndGame($playerId)) {
            $count = $this->game->cards->countItemsInLocation('table'.$playerId);
            foreach($mermaids as $card) {
                $this->game->cards->moveItem($card, 'table'.$playerId, ++$count);
            }

            $this->notify->all('playCards', '', [
                'playerId' => $playerId,
                'cards' => $mermaids,
            ]);

            $this->gamestate->nextState('mermaids');
        } else {
            throw new \BgaUserException("You need the four Mermaids");
        }
    }
}