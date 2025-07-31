define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",    
    getLibUrl('bga-zoom', '1.0.0'),
],
function (dojo, declare, gamegui, counter, BgaZoom) {
    (window as any).BgaZoom = BgaZoom;
    return declare("bgagame.seasaltpaper", ebg.core.gamegui, new SeaSaltPaper());
});