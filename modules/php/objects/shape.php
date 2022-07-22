<?php

class Shape {
    public int $id;
    public string $location;
    public int $location_arg;
    public int $type;

    public function __construct($dbCard) {
        $this->id = intval($dbCard['id']);
        $this->location = $dbCard['location'];
        $this->location_arg = intval($dbCard['location_arg']);
        $this->type = intval($dbCard['type']);
    } 
}
?>