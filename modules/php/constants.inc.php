<?php

/*
 * State constants
 */
define('ST_BGA_GAME_SETUP', 1);

define('ST_NEW_ROUND', 10);

define('ST_PLAYER_TAKE_CARDS', 20);

define('ST_PLAYER_CHOOSE_CARD', 30);

define('ST_PLAYER_PUT_DISCARD_PILE', 35);

define('ST_PLAYER_PLAY_CARDS', 40);
define('ST_PLAYER_CHOOSE_DISCARD_PILE', 45);
define('ST_PLAYER_CHOOSE_DISCARD_CARD', 46);
define('ST_PLAYER_CHOOSE_OPPONENT', 50);

define('ST_NEXT_PLAYER', 75);

define('ST_END_ROUND', 80);

define('ST_END_SCORE', 90);

define('ST_END_GAME', 99);
define('END_SCORE', 100);

/*
 * Constants
 */
define('CHOSEN_DISCARD', 11);
define('END_ROUND_TYPE', 12); /* : */ define('STOP', 1); define('LAST_CHANCE', 2); define('EMPTY_DECK', 3);
define('LAST_CHANCE_CALLER', 13);

/*
 * Cards
 */
// Category
define('MERMAID', 1);
define('PAIR', 2);
define('COLLECTION', 3);
define('MULTIPLIER', 4);

// Pair family
define('CRAB', 1);
define('BOAT', 2);
define('FISH', 3);
define('SWIMMER', 4);
define('SHARK', 5);
// Collection family
define('SHELL', 1);
define('OCTOPUS', 2);
define('PENGUIN', 3);
define('SAILOR', 4);
// Multiplier family
define('LIGHTHOUSE', 1);
define('SHOAL_FISH', 2);
define('PENGUIN_COLONY', 3);
define('CAPTAIN', 4);

define('COLLECTION_POINTS', [
    SHELL => [null, 0, 2, 4, 6, 8, 10],
    OCTOPUS => [null, 0, 3, 6, 9, 12],
    PENGUIN => [null, 1, 3, 5],
    SAILOR => [null, 0, 5],
]);


/*
 * Colors
 */
define('DARK_BLUE', 1);
define('LIGHT_BLUE', 2);
define('BLACK', 3);
define('YELLOW', 4);
define('GREEN', 5);
define('PURPLE', 6);
define('GREY', 7);
define('LIGHT_ORANGE', 8);
define('PINK', 9);
define('ORANGE', 10);

?>
