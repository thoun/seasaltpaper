<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\SeaSaltPaper\Game;
use Bga\Games\SeaSaltPaper\Objects\Card;

class PlaceShellFaceDown extends GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_PLAYER_PLACE_SHELL_FACE_DOWN,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate('${actplayer} may play cards duo'),
            descriptionMyTurn: clienttranslate('${you} can place a Shell face down to be immune to attacks'),
        );
    }

    function getArgs(int $activePlayerId): array
    {
        $hand = $this->game->getPlayerCards($activePlayerId, 'hand', false);

        return [
            'selectableCards' => Arrays::filter($hand, fn (Card $card) => $card->category === COLLECTION && $card->family === SHELL),
        ];
    }

    #[PossibleAction]
    public function actPlaceShellFaceDown(int $id, int $activePlayerId)
    {
        $card = $this->game->cards->getItemById($id);

        if ($card->location != 'hand' . $activePlayerId || $card->category != COLLECTION || $card->family != SHELL) {
            throw new \BgaUserException("You must select a Shell card from your hand");
        }

        $count = $this->game->cards->countItemsInLocation('table' . $activePlayerId);
        $this->game->cards->moveItem($card, 'table' . $activePlayerId, ++$count);
        $card->flipped = true;
        $this->game->cards->updateItem($card, ['flipped']);

        $this->game->notify->all('placeShellFaceDown', clienttranslate('${player_name} places a Shell face down to be immune to attacks'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerNameById($activePlayerId),
            'card' => $card,
        ]);

        $this->game->updateCardsPoints($activePlayerId);

        return PlayCards::class;
    }

    #[PossibleAction]
    public function actCancelPlaceShellFaceDown()
    {
        return PlayCards::class;
    }

    function zombie(int $playerId)
    {
        return $this->actCancelPlaceShellFaceDown();
    }
}
