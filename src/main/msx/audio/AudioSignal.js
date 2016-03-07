// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.AudioSignal = function(source, sampleRate, volume) {

    this.getMixedAudioChannel = function() {
        return source;
    };

    this.signalOn = function() {
        nextSampleToGenerate = 0;
        nextSampleToRetrieve = 0;
        source.signalOn();
        this.play();
    };

    this.signalOff = function() {
        this.mute();
        nextSampleToGenerate = 0;
        nextSampleToRetrieve = 0;
        source.signalOff();
        audioCartridge = undefined;
    };

    this.mute = function() {
        signalOn = false;
    };

    this.play = function() {
        signalOn = true;
    };

    this.setFps = function(fps) {
        // Calculate total samples per frame based on fps
        samplesPerFrame = Math.round(sampleRate / fps);
        if (samplesPerFrame > MAX_SAMPLES) samplesPerFrame = MAX_SAMPLES;
    };

    this.connectAudioCartridge = function(cart) {
        audioCartridge = cart;
    };

    this.disconnectAudioCartridge = function(cart) {
        if (audioCartridge === cart) audioCartridge = undefined;
    };

    this.getAudioCartridge = function() {
        return audioCartridge
    };

    this.audioClockPulse = function() {              // Just one clock pulse, signal always ON
        if (frameSamples < samplesPerFrame) {
            generateNextSampleOn();
            frameSamples = frameSamples + 1;
        }
    };

    this.audioFinishFrame = function() {             // Enough samples to complete frame, signal always ON
        var missingSamples = samplesPerFrame - frameSamples;
        if (missingSamples > 0)
            for (var i = missingSamples; i > 0; i = i - 1) generateNextSampleOn()
        frameSamples = 0;
    };

    this.retrieveSamples = function(quant) {
        //Util.log(">>> Samples generated: " + (nextSampleToGenerate - nextSampleToRetrieve));

        //if (nextSampleToGenerate === nextSampleToRetrieve)
        //    console.log("MATCH: " + nextSampleToGenerate );

        //if (nextSampleToGenerate < nextSampleToRetrieve)
        //    console.log("WRAP: " + nextSampleToGenerate );

        var missing = nextSampleToGenerate >= nextSampleToRetrieve
            ? quant - (nextSampleToGenerate - nextSampleToRetrieve)
            : quant - (MAX_SAMPLES - nextSampleToRetrieve + nextSampleToGenerate);

        if (missing > 0) {
            generateMissingSamples(missing);
            //wmsx.Util.log(">>> Missing samples generated: " + missing);
        } else {
            //wmsx.Util.log(">>> No missing samples");
        }

        var end = nextSampleToRetrieve + quant;
        if (end >= MAX_SAMPLES) end -= MAX_SAMPLES;

        var result = retrieveResult;
        result.start = nextSampleToRetrieve;
        nextSampleToRetrieve = end;

        return result;
    };

    this.getSampleRate = function() {
        return sampleRate;
    };

    var generateNextSampleOn = function() {
        var mixedSample;
        mixedSample = source.nextSample();
        // Add the AudioCartridge value
        if (audioCartridge) mixedSample += audioCartridge.nextSample();

        samples[nextSampleToGenerate] = mixedSample * volume;
        nextSampleToGenerate = nextSampleToGenerate + 1;
        if (nextSampleToGenerate >= MAX_SAMPLES)
            nextSampleToGenerate = 0;

    };

    var generateNextSampleOff = function() {
        samples[nextSampleToGenerate] = 0;
        nextSampleToGenerate = nextSampleToGenerate + 1;
        if (nextSampleToGenerate >= MAX_SAMPLES)
            nextSampleToGenerate = 0;
    };

    var generateMissingSamples = function(quant) {
        if (signalOn)
            for (var i = quant; i > 0; i = i - 1) generateNextSampleOn()
        else
            for (var j = quant; j > 0; j = j - 1) generateNextSampleOff()
    };


    var signalOn = false;

    var nextSampleToGenerate = 0;
    var nextSampleToRetrieve = 0;

    var samplesPerFrame;
    var frameSamples = 0;

    var audioCartridge;

    var MAX_SAMPLES = 12 * WMSX.AUDIO_BUFFER_SIZE;

    var samples = wmsx.Util.arrayFill(new Array(MAX_SAMPLES), 0);

    var retrieveResult = {
        buffer: samples,
        bufferSize: MAX_SAMPLES,
        start: 0
    };


    // Savestate  -------------------------------------------

    this.loadState = function() {
        audioCartridge = undefined;     // Disconnects any AudioCartridge
    };

};
