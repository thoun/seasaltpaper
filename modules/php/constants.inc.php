<?php

/*
 * State constants
 */
const ST_BGA_GAME_SETUP = 1;

const ST_NEW_ROUND = 10;

const ST_PLAYER_TAKE_CARDS = 20;

const ST_PLAYER_CHOOSE_CARD = 30;

const ST_PLAYER_PUT_DISCARD_PILE = 35;

const ST_PLAYER_ANGELFISH_POWER = 38;

const ST_PLAYER_PLAY_CARDS = 40;
const ST_PLAYER_CHOOSE_DISCARD_PILE = 45;
const ST_PLAYER_CHOOSE_DISCARD_CARD = 46;
const ST_PLAYER_CHOOSE_OPPONENT = 50;

const ST_PLAYER_PLACE_SHELL_FACE_DOWN = 60;
const ST_PLAYER_CHOOSE_OPPONENT_CARD = 61;
const ST_PLAYER_STEAL_PLAYED_PAIR = 62;

const ST_NEXT_PLAYER = 75;

const ST_MULTIPLAYER_BEFORE_END_ROUND = 79;
const ST_END_ROUND = 80;
const ST_MULTIPLAYER_CHOOSE_KEPT_EVENT_CARD = 81;

const ST_END_SCORE = 90;

const ST_END_GAME = 99;
const END_SCORE = 100;

/*
 * Constants
 */
const CHOSEN_DISCARD = 11;
const END_ROUND_TYPE = 12; /* : */ const STOP = 1; const LAST_CHANCE = 2; const EMPTY_DECK = 3;
const LAST_CHANCE_CALLER = 13;
const STOP_CALLER = 14;
const BET_RESULT = 15;
const FORCE_TAKE_ONE = 16;
const LOBSTER_POWER = 17;

const EXTRA_SALT_EXPANSION = 101;
const EXTRA_PEPPER_EXPANSION = 102;
const DOUBLE_POINTS = 110;

/**
 * Globals
 */
const DISCARD_EVENT_CARD_PLAYER_ID = 'DISCARD_EVENT_CARD_PLAYER_ID';
const THE_HERMIT_CRAB_CURRENT_PILE = 'THE_HERMIT_CRAB_CURRENT_PILE';
const CAN_CHOOSE_CARD_TO_STEAL = 'CAN_CHOOSE_CARD_TO_STEAL';
const STOLEN_PLAYER = 'STOLEN_PLAYER';

/*
 * Cards
 */
// Category
const MERMAID = 1;
const PAIR = 2;
const COLLECTION = 3;
const MULTIPLIER = 4;
const SPECIAL = 5;

// Pair family
const CRAB = 1;
const BOAT = 2;
const FISH = 3;
const SWIMMER = 4;
const SHARK = 5;
const JELLYFISH = 6;
const LOBSTER = 7;
// Collection family
const SHELL = 1;
const OCTOPUS = 2;
const PENGUIN = 3;
const SAILOR = 4;
// Multiplier family
const LIGHTHOUSE = 1;
const SHOAL_FISH = 2;
const PENGUIN_COLONY = 3;
const CAPTAIN = 4;
const CAST_CRAB = 5;
// Special
const STARFISH = 1;
const SEAHORSE = 2;


/*
 * Colors
 */
const WHITE = 0;
const DARK_BLUE = 1;
const LIGHT_BLUE = 2;
const BLACK = 3;
const YELLOW = 4;
const GREEN = 5;
const PURPLE = 6;
const GREY = 7;
const LIGHT_ORANGE = 8;
const PINK = 9;
const ORANGE = 10;

?>
