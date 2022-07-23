<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * SeaSaltPaper implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 * 
 * states.inc.php
 *
 * SeaSaltPaper game states description
 *
 */

/*
   Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
   in a very easy way from this configuration file.

   Please check the BGA Studio presentation about game state to understand this, and associated documentation.

   Summary:

   States types:
   _ activeplayer: in this type of state, we expect some action from the active player.
   _ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
   _ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide what is the next game state.
   _ manager: special type for initial and final state

   Arguments of game states:
   _ name: the name of the GameState, in order you can recognize it on your own code.
   _ description: the description of the current game state is always displayed in the action status bar on
                  the top of the game. Most of the time this is useless for game state with "game" type.
   _ descriptionmyturn: the description of the current game state when it's your turn.
   _ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
   _ action: name of the method to call when this game state become the current game state. Usually, the
             action method is prefixed by "st" (ex: "stMyGameStateName").
   _ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
                      method on both client side (Javacript: this.checkAction) and server side (PHP: self::checkAction).
   _ transitions: the transitions are the possible paths to go from a game state to another. You must name
                  transitions in order to use transition names in "nextState" PHP method, and use IDs to
                  specify the next game state for each transition.
   _ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
           client side to be used on "onEnteringState" or to set arguments in the gamestate description.
   _ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
                            method).
*/

//    !! It is not a good idea to modify this file when a game is running !!

require_once("modules/php/constants.inc.php");

$basicGameStates = [

    // The initial state. Please do not modify.
    ST_BGA_GAME_SETUP => [
        "name" => "gameSetup",
        "description" => clienttranslate("Game setup"),
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => [ "" => ST_PLAYER_TAKE_CARDS ]
    ],
   
    // Final state.
    // Please do not modify.
    ST_END_GAME => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd",
    ],
];


$playerActionsGameStates = [

    ST_PLAYER_TAKE_CARDS => [
        "name" => "takeCards",
        "description" => clienttranslate('${actplayer} must take two cards from deck or one card from a discard pile'),
        "descriptionmyturn" => clienttranslate('${you} must take two cards from deck or one card from a discard pile'),
        "descriptionNoDiscard" => clienttranslate('${actplayer} must take two cards from deck'),
        "descriptionmyturnNoDiscard" => clienttranslate('${you} must take two cards from deck'),
        "type" => "activeplayer",
        "args" => "argTakeCards",
        "possibleactions" => [ 
            "takeCardsFromDeck",
            "takeCardFromDiscard",
        ],
        "transitions" => [
            "playCards" => ST_PLAYER_PLAY_CARDS,
            "chooseCard" => ST_PLAYER_CHOOSE_CARD,
        ]
    ],

    ST_PLAYER_CHOOSE_CARD => [
        "name" => "chooseCard",
        "description" => clienttranslate('${actplayer} must choose a card to keep'),
        "descriptionmyturn" => clienttranslate('${you} must choose a card to keep'),
        "type" => "activeplayer",
        "possibleactions" => [ 
            "chooseCard",
        ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER,
        ]
    ],

    ST_PLAYER_PUT_DISCARD_PILE => [
        "name" => "putDiscardPile",
        "description" => clienttranslate('${actplayer} must choose a discard pile for the other card'),
        "descriptionmyturn" => clienttranslate('${you} must choose a discard pile for the other card'),
        "type" => "activeplayer",
        "possibleactions" => [ 
            "putDiscardPile",
        ],
        "transitions" => [
            "playCards" => ST_PLAYER_PLAY_CARDS,
        ]
    ],

    ST_PLAYER_PLAY_CARDS => [
        "name" => "playCards",
        "description" => clienttranslate('${actplayer} may play cards duo'),
        "descriptionmyturn" => clienttranslate('${you} may play cards duo'),
        "type" => "activeplayer",
        "possibleactions" => [ 
            "playCards",
            "endRound",
            "immediateEndRound",
        ],
        "transitions" => [
            "chooseDiscardPile" => ST_PLAYER_CHOOSE_DISCARD_PILE,
            "chooseOpponent" => ST_PLAYER_CHOOSE_OPPONENT,
            "playCards" => ST_PLAYER_PLAY_CARDS,
            "endTurn" => ST_NEXT_PLAYER,
            "immediateEndRound" => ST_END_ROUND,
        ]
    ],

    ST_PLAYER_CHOOSE_DISCARD_PILE => [
        "name" => "chooseDiscardPile",
        "description" => clienttranslate('${actplayer} must choose a discard pile'),
        "descriptionmyturn" => clienttranslate('${you} must choose a discard pile'),
        "type" => "activeplayer",
        "possibleactions" => [ 
            "chooseDiscardPile",
        ],
        "transitions" => [
            "chooseCard" => ST_PLAYER_CHOOSE_DISCARD_CARD,
        ]
    ],

    ST_PLAYER_CHOOSE_DISCARD_CARD => [
        "name" => "chooseDiscardCard",
        "description" => clienttranslate('${actplayer} must choose a card'),
        "descriptionmyturn" => clienttranslate('${you} must choose a card'),
        "type" => "activeplayer",
        "possibleactions" => [ 
            "chooseDiscardCard",
        ],
        "transitions" => [
            "playCards" => ST_PLAYER_PLAY_CARDS,
        ]
    ],

    ST_PLAYER_CHOOSE_OPPONENT => [
        "name" => "chooseOpponent",
        "description" => clienttranslate('${actplayer} must choose an opponent to steal'),
        "descriptionmyturn" => clienttranslate('${you} must choose an opponent to steal'),
        "type" => "activeplayer",
        "possibleactions" => [ 
            "chooseOpponent",
        ],
        "transitions" => [
            "playCards" => ST_PLAYER_PLAY_CARDS,
        ]
    ],
];

$gameGameStates = [

    ST_NEXT_PLAYER => [
        "name" => "nextPlayer",
        "description" => "",
        "type" => "game",
        "action" => "stNextPlayer",
        "updateGameProgression" => true,
        "transitions" => [
            "nextPlayer" => ST_PLAYER_TAKE_CARDS, 
            "endRound" => ST_END_ROUND,
        ],
    ],

    ST_END_ROUND => [
        "name" => "endRound",
        "description" => "",
        "type" => "game",
        "action" => "stEndRound",
        "transitions" => [
            "newRound" => ST_PLAYER_TAKE_CARDS,
            "endScore" => ST_END_SCORE,
        ],
    ],

    ST_END_SCORE => [
        "name" => "endScore",
        "description" => "",
        "type" => "game",
        "action" => "stEndScore",
        "transitions" => [
            "endGame" => ST_END_GAME,
        ],
    ],
];
 
$machinestates = $basicGameStates + $playerActionsGameStates + $gameGameStates;