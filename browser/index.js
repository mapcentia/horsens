
/* http://localhost:3000/app/dk/test/?tmpl=modal.tmpl#geodk.bright/11/9.8942/55.8451/ */

/* WORKING WITH HORSENS URL: http://localhost:3000/app/horsens/indsatsplaner/?config=horsens.json */

/**
 *
 * @type {*|exports|module.exports}
 */
var urlparser = require('./../../../browser/modules/urlparser');

/**
 *
 * @type {array}
 */
var urlVars = urlparser.urlVars;

/**
 * @type {string}
 */
var db = urlparser.db;

var sayHelloWorld;
var streetViewModule;
var vectorLayers;
var switchLayer;
var backboneEvents;

var layerGroup = [];
var horsensPopup = L.popup();
var meta;
var pointToLayerFunction;
var onEachFeatureFunction;
var cloud;
var map;
var filteredLayers;
var layers;
var featureGroupCollection = {
    features : [],
    type: "FeatureCollection"
};
var geoJsonObject;
var baseLayers;

module.exports = {
    set: function(o){
        meta = o.meta;
        vectorLayers = o.extensions.vectorLayers.index;
        switchLayer = o.switchLayer;
        backboneEvents = o.backboneEvents;
        cloud = o.cloud;
        layers = o.layers;
        baseLayers = o.baseLayer;
    },
    init: function(){
        $(".leaflet-top.leaflet-right").children().remove();
        $('#horsensSecondNavbar a').click(function () {
            $('#horsensSecondNavbar .nav-item').each(function(index, value){
                $(value).removeClass("active");
            });
            $(this).parent().addClass('active');
        });

        map = cloud.get().map;
        $('.horsens-side-bar').hide("fast");
        $('.horsens-layer-control').hide();
        $('#horsens-home').parent().addClass("active");
        
        $('.areas').click(function(){
            $('#horsensSecondNavbar').collapse("hide");
            var areaSelected = (parseInt($(this).attr("id")));
            selectAnArea(areaSelected);
        });

        function selectAnArea(areaSelected){
            map.removeLayer(geoJsonObject);
            $('.horsens-side-bar').hide("fast");
            var foundMatchingGeoJson = false;
            geoJsonObject = L.geoJSON(featureGroupCollection, {onEachFeature: onEachFeatureFunction, pointToLayer: pointToLayerFunction, filter: function(e){
                console.log(areaSelected);
                if(typeof e.properties.id != "undefined" && parseInt(e.properties.id) == areaSelected){
                    $('.horsens-side-bar').show("fast");
                    foundMatchingGeoJson = true;
                    return true;
                }else if(typeof e.properties.omraade != "undefined" && parseInt(e.properties.omraade) == areaSelected){
                    $('.horsens-side-bar').show("fast");
                    foundMatchingGeoJson = true;
                    return true;
                }else{
                    return false;
                }
            }}).addTo(map);
            if(foundMatchingGeoJson){
                map.fitBounds(geoJsonObject.getBounds(), {animate:true});
            }
        }

        $('#horsens-home').click(function(){
            $('#horsensSecondNavbar').collapse("hide");
            $('.horsens-side-bar').hide("fast");
            map.removeLayer(geoJsonObject);
            geoJsonObject = L.geoJSON(featureGroupCollection, {onEachFeature: onEachFeatureFunction, pointToLayer: pointToLayerFunction}).addTo(map);
            map.fitBounds(geoJsonObject.getBounds(), {animate:true});
        });

        /* Map controls */
        $('.horsens-map-control-plus').click(function(){ map.zoomIn()});
        $('.horsens-map-control-minus').click(function(){map.zoomOut()});
        $('.horsens-map-control-home').click(function(){ map.fitBounds(geoJsonObject.getBounds(), {animate:true});});
        $('.horsens-map-control-layers').click(function(){$('.horsens-layer-control').animate({height:"toggle", opacity:"toggle"})});

        onEachFeatureFunction = function(feature, layer){
            //console.log(feature);
            if(feature.geometry.type == "MultiPoint" && feature.properties.navn){
                layer.bindPopup(
                    '<h3>'+feature.properties.navn+
                    '</h3> <hr> <p>'+feature.properties.beskrivelse+
                    '</p> <br> <a class="btn btn-default btn-sm teal darken-3 ml-0"  target="_blank" href="'+feature.properties.pdf+
                    '">Link</a>', {className: "horsens-popup"});
            }else if(feature.geometry.type == "MultiPolygon"){
                $('.horsens-side-bar').children("img").attr("src", "http://sektorplaner.horsens.dk"+feature.properties.img);
                console.log(feature);
                $('.horsens-side-bar').children("p").html(feature.properties.tekst);
                layer.on('click', function(){
                    selectAnArea(feature.properties.id);
                    $('#horsensSecondNavbar .nav-item').each(function(index, value){
                        $(value).removeClass("active");
                    });
                    $("#"+feature.properties.id).parent().addClass('active');
                })
            }
        };

        //vectorLayers.setOnEachFeature('v:indsatsplaner.vandvaerk_view', onEachFeatureFunction);

        pointToLayerFunction = function(feature, latlng){
            if(feature.properties.navn){
                
            }
            return L.marker(latlng, {
                icon: L.ExtraMarkers.icon({
                    icon: "",
                    shape: "circle",
                    markerColor: "blue-dark"
                })
            })
            
        };

        //vectorLayers.setPointToLayer('v:indsatsplaner.vandvaerk_view', pointToLayerFunction);

        map.on('dragstart', function(){
            $('.horsens-container').fadeTo("fast", 0.1);
            console.log('dragging started!')
        })
        map.on('dragend', function(){
            $('.horsens-container').fadeTo("fast", 1);
        })
        
        

        var compareLayersToLoad = 0;
        backboneEvents.get().on("ajax:completed", function(e){
            if(compareLayersToLoad >= e[0]){
                geoJsonObject = L.geoJSON(featureGroupCollection, {onEachFeature : onEachFeatureFunction, pointToLayer: pointToLayerFunction}).addTo(map);
                map.fitBounds(geoJsonObject.getBounds());
            }
        })
        backboneEvents.get().on("ready:vectorLayers", function () {
            var collectionOfLayers = meta.getMetaData();
            console.log('loading base layers',window.setBaseLayers);
            console.log('cloud get?',cloud.get());
            if(collectionOfLayers.data.length > 0){
                filteredLayers = collectionOfLayers.data.filter(function(value, index){
                    return value.f_table_schema == "indsatsplaner" && value.f_table_name.indexOf("_view") >= 0;
                });
            }
            filteredLayers.forEach(function(value, index){
                //console.log(vectorLayers.getStores());
                var tempValue = 'v:'+value.f_table_schema + "." + value.f_table_name;
                //vectorLayers.switchLayer(tempValue, true);
                if(typeof vectorLayers.getStores()[tempValue] !== "undefined"){
                    vectorLayers.getStores()[tempValue].layer.options.onEachFeature = onEachFeatureFunction;
                    vectorLayers.getStores()[tempValue].layer.options.pointToLayer = pointToLayerFunction;
                    
                    vectorLayers.getStores()[tempValue].load().done(function(e){
                        e.features.forEach(function(value){featureGroupCollection.features.push(value)});
                        compareLayersToLoad++;
                        backboneEvents.get().trigger("ajax:completed", [filteredLayers.length]);
                    });
                }
                //var tempGroup = L.layerGroup();
            });

        });
    }
}