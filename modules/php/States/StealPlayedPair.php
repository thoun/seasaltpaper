<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\SeaSaltPaper\Game;

class StealPlayedPair extends GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_PLAYER_STEAL_PLAYED_PAIR,
            type: StateType::ACTIVE_PLAYER,
            name: 'stealPlayedPair',
            description: clienttranslate('${actplayer} must select a played pair to steal'),
            descriptionMyTurn: clienttranslate('${you} must select a played pair to steal'),
        );
    }

    function getArgs(int $activePlayerId): array
    {
        $opponentIds = $this->game->getPossibleOpponentsToStealFromTable($activePlayerId);
        $possiblePairs = [];
        foreach ($opponentIds as $opponentId) {
            $possiblePairs[$opponentId] = $this->game->getPlayedPairs($opponentId);
        }

        return [
            'possiblePairs' => $possiblePairs,
            'opponentIds' => Arrays::filter($this->game->getPlayersIds(), fn ($pId) => $activePlayerId != $pId),
        ];
    }

    #[PossibleAction]
    public function actStealPlayedPair(int $stolenPlayerId, int $id, int $activePlayerId, array $args)
    {
        if (!array_key_exists($stolenPlayerId, $args['possiblePairs'])) {
            throw new \BgaUserException("You can't steal a pair from this player");
        }
        $cards = Arrays::find($args['possiblePairs'][$stolenPlayerId], fn ($possiblePair) => Arrays::some($possiblePair, fn ($card) => $card->id === $id));
        if ($cards === null) {
            throw new \BgaUserException("Invalid pair");
        }

        $count = $this->game->cards->countItemsInLocation('table' . $activePlayerId);
        foreach ($cards as &$card) {
            $card->location = 'table' . $activePlayerId;
            $card->locationArg = ++$count;
            $this->game->cards->moveItem($card, $card->location, $card->locationArg);
        }

        $this->game->notify->all('stealPlayedPair', clienttranslate('${player_name} steals cards ${cardColor1} ${cardName1} and ${cardColor2} ${cardName2} from ${player_name2}'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerNameById($activePlayerId),
            'player_name2' => $this->game->getPlayerNameById($stolenPlayerId),
            'cards' => $cards,
            'cardName1' => $this->game->getCardName($cards[0]),
            'cardName2' => $this->game->getCardName($cards[1]),
            'cardColor1' => $this->game->COLORS[$cards[0]->color],
            'cardColor2' => $this->game->COLORS[$cards[1]->color],
            'i18n' => ['cardName1', 'cardName2', 'cardColor1', 'cardColor2'],
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $activePlayerId,
        ]);

        $this->game->updateCardsPoints($activePlayerId);
        return PlayCards::class;
    }

    function zombie(int $playerId)
    {
        $args = $this->getArgs($playerId);
        $possibleMoves = $args['opponentIds'];
        $opponentId = $possibleMoves[bga_rand(0, count($possibleMoves) - 1)]; // random choice over possible moves

        $possibleMoves = $args['possiblePairs'][$opponentId];
        $pair = $possibleMoves[bga_rand(0, count($possibleMoves) - 1)]; // random choice over possible moves

        return $this->actStealPlayedPair($opponentId, $pair[0]->id, $playerId, $args);
    }
}
