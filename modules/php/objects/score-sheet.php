<?php

class SimpleZoneScoreSheet {
    public int $checked = 0;

    public int $total = 0;
}

class StudentsScoreSheet {
    public int $checkedStudents = 0;
    public int $checkedInternships = 0;
    public int $checkedSchools = 0;
    public /*int|null*/ $specialSchool = null;

    public int $subTotal = 0;
    public int $total = 0;
}

class TouristsScoreSheet {
    public array/*int[]*/ $checkedTourists = [0, 0, 0];
    public int $checkedMonumentsLight = 0;
    public int $checkedMonumentsDark = 0; 
    public /*int|null*/ $specialMonumentLight = null;
    public /*int|null*/ $specialMonumentDark = null;
    public /*int|null*/ $specialMonumentMax = null;

    public array/*int[]*/ $subTotals = [];
    public int $total = 0;
}

class BusinessmenScoreSheet {
    public array/*int[]*/ $checkedBusinessmen = [0, 0, 0];
    public /*int|null*/ $specialOffice = null;

    public array/*int[]*/ $subTotals = [];
    public int $total = 0;
}

class ObjectivesScoreSheet {
    public array/*int[]*/ $subTotals = [null, null];
    public /*int|null*/ $total = null;
}

class ScoreSheet {
    public SimpleZoneScoreSheet $oldLadies;
    public StudentsScoreSheet $students;
    public TouristsScoreSheet $tourists;
    public BusinessmenScoreSheet $businessmen;
    public ObjectivesScoreSheet $commonObjectives;
    public ObjectivesScoreSheet $personalObjective;
    public SimpleZoneScoreSheet $turnZones;
    public SimpleZoneScoreSheet $trafficJam;

    public int $total = 0;

    public function __construct() {
        $this->oldLadies = new SimpleZoneScoreSheet();
        $this->students = new StudentsScoreSheet();
        $this->tourists = new TouristsScoreSheet();
        $this->businessmen = new BusinessmenScoreSheet();
        $this->commonObjectives = new ObjectivesScoreSheet();
        $this->personalObjective = new ObjectivesScoreSheet();
        $this->turnZones = new SimpleZoneScoreSheet();
        $this->trafficJam = new SimpleZoneScoreSheet();
    } 
}

class ScoreSheets {
    public ScoreSheet $validated;
    public ScoreSheet $current;

    public function __construct(ScoreSheet $validated, ScoreSheet $current) {
        $this->validated = $validated;
        $this->current = $current;
        
    } 
}
?>