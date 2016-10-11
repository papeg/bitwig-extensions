loadAPI(1);

host.defineController("Edirol", "PCR-300", "1.0", "08B54374-2AF7-4C1F-AB81-E4DDA0957165");
host.defineMidiPorts(3, 2);

host.addDeviceNameBasedDiscoveryPair(["PCR MIDI", "PCR 1", "PCR 2"], ["PCR MIDI", "PCR 1"]);

var transport; // a view onto bitwig's transport section
var cursorDevice;
var masterTrack;

const MIDI_RES = 128;

// This script is written for "control map" 0 of the PCR keyboard.
// See the README.md for instructions on how to change or reset the control map.
function init() {
  transport = host.createTransport();
  cursorDevice = host.createCursorDevice(); // tracks, sends, scenes
  masterTrack = host.createMasterTrack(0);

  // Note input, exclude filtered messages from callback
  host.getMidiInPort(1).createNoteInput("PCR-300", "8?????" // Note On
    , "9?????" // Note Off
    , "B?40??" // Damper Pedal
    , "D?????" // Channel Pressue / After-Touch
    , "E?????"); // Pitch Bend

  // Control input
  host.getMidiInPort(2).setMidiCallback(midiInPCR2);
}

var controlMap = {
  "play": {
    "match": function(channel, data1) {
      return channel === 14 && data1 == 82;
    },
    "func": function(status, data1, data2) {
      if (data2 === 127) {
        transport.play();
      }
    }
  },
  "stop": {
    "match": function(channel, data1) {
      return channel === 13 && data1 == 82;
    },
    "func": function(status, data1, data2) {
      if (data2 === 127) {
        transport.stop();
      }
    }
  },
  "rewind": {
    "match": function(channel, data1) {
      return channel === 8 && data1 == 82;
    },
    "func": function(status, data1, data2) {
      if (data2 === 127) {
        transport.rewind();
      }
    }
  },
  "record": {
    "match": function(channel, data1) {
      return channel === 10 && data1 == 82;
    },
    "func": function(status, data1, data2) {
      if (data2 === 127) {
        transport.record();
      }
    }
  },
  "masterFader": {
    "match": function(channel, data1) {
      return channel === 1 && data1 == 18;
    },
    "func": function(status, data1, data2) {
      masterTrack.getVolume().set(data2, MIDI_RES);
    }
  }
};

function midiInPCR2(status, data1, data2) {
  println(status + "(" + channel(status) + "), " + data1 + ", " + data2);
  if (isChannelController(status)) {
    for (var key in controlMap) {
      match = controlMap[key].match;
      func = controlMap[key].func;
      if (match(channel(status), data1)) {
        func(status, data1, data2);
      }
    }
  }
}

function channel(status) {
  return status & 0xF;
}
