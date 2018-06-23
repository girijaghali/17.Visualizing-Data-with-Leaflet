// Store our API endpoint inside queryUrl
//var queryUrl = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2014-01-01&endtime=2014-01-02&maxlongitude=-69.52148437&minlongitude=-123.83789062&maxlatitude=48.74894534&minlatitude=25.16517337";

var earthquakeURL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'
var tectonicUrl = 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json';


renderMap(earthquakeURL, tectonicUrl);

function renderMap(earthquakeURL, tectonicUrl) {
  // d3.json(queryUrl, function(data) {
  //   var earthquakeData = data;
  // });

  // d3.json(tectonicUrl, function(data) {
  //   var tectonicData = data;
  // });
  // createFeatures(earthquakeData, tectonicData);
  d3.json(earthquakeURL, function(data) {
    var earthquakeData = data;
    d3.json(tectonicUrl, function(data) {
      var tectonicData = data;
      createFeatures(earthquakeData, tectonicData);
    });//innerd3
  });//outerd3

  function createFeatures(earthquakeData,tectonicData) {
    
    function onEachQuakeLayer(feature, layer) {
      return new L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
          fillOpacity: 1,
          color: chooseColor(feature.properties.mag),
          fillColor: chooseColor(feature.properties.mag),
          radius:  markerSize(feature.properties.mag)
      });
    }
    function onEachEarthquake(feature, layer) {
      layer.bindPopup("<h3>" + feature.properties.place + "</h3><hr><p>" + new Date(feature.properties.time) + "</p><hr><p>Magnitude: " + feature.properties.mag + "</p>");
    };
    function onEachTectonicLine(feature, layer) {
      L.polyline(feature.geometry.coordinates);
    };

    var earthquakes = L.geoJSON(earthquakeData, {
      onEachFeature: onEachEarthquake,
      pointToLayer: onEachQuakeLayer
    });

    var tectonicLines = L.geoJSON(tectonicData, {
      onEachFeature: onEachTectonicLine,
      style: {
          weight: 2,
          color: 'blue'
      }
    });

    var timelineLayer = L.timeline(earthquakeData, {
      getInterval: function(feature) {
          return {
              start: feature.properties.time,
              end: feature.properties.time + feature.properties.mag * 10000000
          };
      },
      pointToLayer: onEachQuakeLayer,
      onEachFeature: onEachEarthquake
    });

    // function onEachFeature(feature, layer) {
    //   layer.bindPopup("<h3>" + feature.properties.place +
    //     "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
    // }
    //createMap(earthquakes);
    createMap(earthquakes, tectonicLines, timelineLayer); 
    // createMap(earthquakes, tectonicLines); 
  }//createfeatures

  function createMap(earthquakes, tectonicLines, timelineLayer) {
    var satellite = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/256/{z}/{x}/{y}?" +
      "access_token=pk.eyJ1IjoiZ2lyaWphZ2hhbGkiLCJhIjoiY2podHc2anplMGk1ZTNycHEwcDVtMHhqZCJ9.Q_7Sm4A-tvybPQJ_mAOa1g");

    var grayscale = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?" +
      "access_token=pk.eyJ1IjoiZ2lyaWphZ2hhbGkiLCJhIjoiY2podHc2anplMGk1ZTNycHEwcDVtMHhqZCJ9.Q_7Sm4A-tvybPQJ_mAOa1g");

    var outdoors = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v9/tiles/256/{z}/{x}/{y}?" +
    "access_token=pk.eyJ1IjoiZ2lyaWphZ2hhbGkiLCJhIjoiY2podHc2anplMGk1ZTNycHEwcDVtMHhqZCJ9.Q_7Sm4A-tvybPQJ_mAOa1g");

    var baseMaps = {
      "Satellite": satellite,
      "Grayscale": grayscale,
      "Outdoors": outdoors
    };

    var overlayMaps = {
      "Earthquakes": earthquakes,
      "Fault Lines": tectonicLines
    };

    var myMap = L.map("map", {
      center: [37.09, -95.71],
      zoom: 5,
      layers: [satellite, earthquakes]
    });

    L.control.layers(baseMaps, overlayMaps, {
      collapsed: false
    }).addTo(myMap);

    // Adds Legend
    var legend = L.control({position: 'bottomright'});
    legend.onAdd = function(map) {
        var div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 1, 2, 3, 4, 5],
            labels=[];
              
        for (var i = 0; i < grades.length; i++) {
              div.innerHTML += '<i style="background:' + chooseColor(grades[i] + 1) + '"></i> ' +
                  grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            // div.innerHTML += '<i style="background:' + 'yellow' + '"></i> ' +
            // grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        
          };
        return div;
    };
    legend.addTo(myMap);

    var timelineControl = L.timelineSliderControl({
      formatOutput: function(date) {
          return new Date(date).toString();
      }
    });
    timelineControl.addTo(myMap);
    timelineControl.addTimelines(timelineLayer);
    timelineLayer.addTo(myMap);
  }//createmap
}//rendermap


//----------------------------------------------------------------------------
// chooseColor function:
// Returns color for each grade parameter using ternary expressions
//----------------------------------------------------------------------------
function chooseColor(magnitude) {
  return magnitude > 5 ? "red":
         magnitude > 4 ? "orange":
         magnitude > 3 ? "gold":
         magnitude > 2 ? "yellow":
         magnitude > 1 ? "yellowgreen":
                         "greenyellow"; // <= 1 default
};

//----------------------------------------------------------------------------
// Function to amplify circle size by earthquake magnitude
//----------------------------------------------------------------------------
function markerSize(magnitude) {
    return magnitude * 3;
};