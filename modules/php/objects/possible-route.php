<?php

class PossibleRoute {
    public int $from;
    public int $to;
    public int $trafficJam;
    public bool $useTurnZone;
    public bool $isElimination;

    public function __construct(int $from, int $to, int $trafficJam, bool $useTurnZone, bool $isElimination) {
        $this->from = $from;
        $this->to = $to;
        $this->trafficJam = $trafficJam;
        $this->useTurnZone = $useTurnZone;
        $this->isElimination = $isElimination;
    } 
}
?>