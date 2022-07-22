<?php

class CommonObjective {
    public int $id;
    public int $number;
    public bool $completed;
    public int $completedAtRound;

    public function __construct($dbCard) {
        $this->id = intval($dbCard['id']);
        $this->number = intval($dbCard['number']);
        $this->completed = $dbCard['completed_at_round'] != null;
        $this->completedAtRound = intval($dbCard['completed_at_round']);
    } 
}
?>