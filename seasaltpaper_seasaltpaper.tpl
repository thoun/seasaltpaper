{OVERALL_GAME_HEADER}

<div id="zoom-wrapper">

    <div id="myhand-wrap" class="whiteblock hand-wrap">
        <div id="my-hand-label" class="hand-label">
            <button id="sortByWeight" class="sort-button"><div class="sort-icon" data-type="weight"></div></button>
            <button id="sortByGender" class="sort-button"><div class="sort-icon" data-type="gender"></div></button>
            <h3>{MY_HAND}</h3>
        </div>
        <div id="my-hand" class="hand-cards"></div>
    </div>

    <div id="full-table">
        <div id="round-panel" class="whiteblock"></div>
        <div id="deck"></div>
        <div id="discards">
                <div id="discard1" class="discard-stack" data-discard="1"></div>
                <div id="discard2" class="discard-stack" data-discard="2"></div>
        </div>
        <div id="pick" data-visible="false"></div>

        <div id="map">
            <div id="map-elements">
                <div id="ticket-slot-1" class="ticket-slot"></div>
                <div id="ticket-slot-2" class="ticket-slot"></div>
                <div id="common-objective-slot-1" class="common-objective-slot"></div>
                <div id="common-objective-slot-2" class="common-objective-slot"></div>
            </div>
            <div id="pips-top" class="pips"></div>
            <div id="pips-bottom" class="pips"></div>
        </div>
    </div>
    <div id="zoom-controls">
        <button id="zoom-out"></button>
        <button id="zoom-in"></button>
    </div>
</div>

{OVERALL_GAME_FOOTER}
