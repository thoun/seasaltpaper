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
 * material.inc.php
 *
 * SeaSaltPaper game material description
 *
 * Here, you can describe the material of your game with PHP variables.
 *   
 * This file is loaded in your game logic class constructor, ie these variables
 * are available everywhere in your game logic code.
 *
 */

require_once('modules/php/objects/card.php');

$this->COLORS = [
  null,
  clienttranslate('Dark blue'),
  clienttranslate('Light blue'),
  clienttranslate('Black'),
  clienttranslate('Yellow'),
  clienttranslate('Green'),
  clienttranslate('White'),
  clienttranslate('Purple'),
  clienttranslate('Gray'),
  clienttranslate('Light orange'),
  clienttranslate('Pink'),
  clienttranslate('Orange'),
];

$this->CARDS = [
  new SirenCard(),

  new CrabPairCard(DARK_BLUE, 2),
  new CrabPairCard(LIGHT_BLUE, 2),
  new CrabPairCard(BLACK),
  new CrabPairCard(YELLOW, 2),
  new CrabPairCard(GREEN),
  new CrabPairCard(GREY),

  new BoatPairCard(DARK_BLUE, 2),
  new BoatPairCard(LIGHT_BLUE, 2),
  new BoatPairCard(BLACK, 2),
  new BoatPairCard(YELLOW, 2),

  new FishPairCard(DARK_BLUE, 2),
  new FishPairCard(LIGHT_BLUE),
  new FishPairCard(BLACK, 2),
  new FishPairCard(YELLOW),
  new FishPairCard(GREEN),

  new SwimmerPairCard(DARK_BLUE),
  new SwimmerPairCard(LIGHT_BLUE),
  new SwimmerPairCard(BLACK),
  new SwimmerPairCard(YELLOW),
  new SwimmerPairCard(LIGHT_ORANGE),

  new SharkPairCard(DARK_BLUE),
  new SharkPairCard(LIGHT_BLUE),
  new SharkPairCard(BLACK),
  new SharkPairCard(GREEN),
  new SharkPairCard(PURPLE),

  new CollectionCard(SHELL, DARK_BLUE),
  new CollectionCard(SHELL, LIGHT_BLUE),
  new CollectionCard(SHELL, BLACK),
  new CollectionCard(SHELL, YELLOW),
  new CollectionCard(SHELL, GREEN),
  new CollectionCard(SHELL, GREY),

  new CollectionCard(OCTOPUS, LIGHT_BLUE),
  new CollectionCard(OCTOPUS, YELLOW),
  new CollectionCard(OCTOPUS, GREEN),
  new CollectionCard(OCTOPUS, PURPLE),
  new CollectionCard(OCTOPUS, GREY),

  new CollectionCard(PENGUIN, PURPLE),
  new CollectionCard(PENGUIN, LIGHT_ORANGE),
  new CollectionCard(PENGUIN, PINK),

  new CollectionCard(SAILOR, PINK),
  new CollectionCard(SAILOR, ORANGE),
  
  new MultiplierCard(LIGHTHOUSE, PAIR, BOAT, PURPLE, 1),
  new MultiplierCard(SHOAL_FISH, PAIR, FISH, GREY, 1),
  new MultiplierCard(PENGUIN_COLONY, COLLECTION, PENGUIN, GREEN, 2),
  new MultiplierCard(CAPTAIN, COLLECTION, SAILOR, LIGHT_ORANGE, 3),
];



