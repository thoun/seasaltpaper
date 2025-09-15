<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\SeaSaltPaper\Game;
use Bga\Games\SeaSaltPaper\Objects\Card;

class SwapCard extends GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_PLAYER_SWAP_CARD,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate('${actplayer} can swap an opponent card with one of theirs'),
            descriptionMyTurn: clienttranslate('${you} can swap an opponent card with one of yours'),
        );
    }

    function getArgs(int $activePlayerId): array
    {
        $opponentId = $this->game->globals->get(STOLEN_PLAYER);

        $cards = $this->game->getPlayerCards($opponentId, 'hand', false);
        usort($cards, fn ($a, $b) => $a->locationArg <=> $b->locationArg);
        $maskedCards = Card::onlyIds($cards);

        return [
            'opponentId' => $opponentId,
            '_private' => [
                $activePlayerId => [
                    'cards' => $cards,
                ]
            ],
            'cards' => $maskedCards,
        ];
    }

    #[PossibleAction]
    public function actSwapCard(int $playerCardId, int $opponentCardId, int $activePlayerId)
    {
        $opponentId = $this->game->globals->get(STOLEN_PLAYER);

        $playerCard = Arrays::find($this->game->getPlayerCards($activePlayerId, 'hand', false), fn ($card) => $card->id === $playerCardId);
        $opponentCard = Arrays::find($this->game->getPlayerCards($opponentId, 'hand', false), fn ($card) => $card->id === $opponentCardId);
        if ($playerCard === null || $opponentCard === null) {
            throw new \BgaUserException("Invalid card");
        }

        $this->game->cards->moveItem($opponentCard, 'hand' . $activePlayerId);
        $this->game->cardCollected($activePlayerId, $opponentCard);
        $this->game->cards->moveItem($playerCard, 'hand' . $opponentId);
        $this->game->cardCollected($opponentId, $playerCard);

        $args = [
            'playerId' => $activePlayerId,
            'opponentId' => $opponentId,
            'player_name' => $this->game->getPlayerNameById($activePlayerId),
            'player_name2' => $this->game->getPlayerNameById($opponentId),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $activePlayerId,
            'opponentCards' => Card::onlyIds($this->game->getPlayerCards($opponentId, 'hand', false)),
        ];
        $argCardName = [
            'cardName' => $this->game->getCardName($playerCard),
            'cardColor' => $this->game->COLORS[$playerCard->color],
            'cardName2' => $this->game->getCardName($opponentCard),
            'cardColor2' => $this->game->COLORS[$opponentCard->color],
            'i18n' => ['cardName', 'cardColor', 'cardName2', 'cardColor2'],
        ];
        $argCard = [
            'card' => $playerCard,
            'card2' => $opponentCard,
        ];
        $argMaskedCard = [
            'card' => Card::onlyId($playerCard),
            'card2' => Card::onlyId($opponentCard),
        ];

        $this->game->notify->all('swapCard', clienttranslate('${player_name} swap a card with one from ${player_name2} hand'), $args + $argMaskedCard);
        $this->game->notifyPlayer($opponentId, 'swapCard', clienttranslate('Card ${cardColor} ${cardName} was swapped with ${cardColor2} ${cardName2} from your hand'), $args + $argCardName + $argCard);
        $this->game->notifyPlayer($activePlayerId, 'swapCard', clienttranslate('Card ${cardColor} ${cardName} was swapped with ${cardColor2} ${cardName2} from ${player_name2} hand'), $args + $argCardName + $argCard);

        $this->game->updateCardsPoints($activePlayerId);
        $this->game->updateCardsPoints($opponentId);

        return PlayCards::class;
    }

    #[PossibleAction]
    public function actPassSwapCard(int $activePlayerId)
    {
        $opponentId = $this->game->globals->get(STOLEN_PLAYER);

        $this->game->notifyPlayer($activePlayerId, 'passSwapCard', '', [
            'playerId' => $activePlayerId,
            'opponentId' => $opponentId,
            'opponentCards' => Card::onlyIds($this->game->getPlayerCards($opponentId, 'hand', false)),
        ]);

        return PlayCards::class;
    }

    function zombie(int $playerId)
    {
        return $this->actPassSwapCard($playerId);
    }
}
