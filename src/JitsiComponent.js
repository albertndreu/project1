import React, { useEffect, useState,Link, useRef  } from 'react';
import JitsiMeetJS from 'lib-jitsi-meet';
import $ from 'jquery';
import 'strophe.js';
import 'strophejs-plugin-disco';
import 'strophejs-plugin-caps';



const JitsiComponent = () => {


const options = {
    hosts: {
        domain: 'jitsi-meet.example.com',
        muc: 'conference.jitsi-meet.example.com'
    },
    bosh: '//jitsi-meet.example.com/http-bind'
};

const confOptions = {
};

const  [connection, setConnection] = useState(null);
const [isJoined, setIsJoined] = useState(false);
const [room,setRoom] = useState(null);

const [localTracks,setLocalTracks] = useState([]);
const [remoteTracks,setRemoteTracks] = useState({});

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(track) {
  setLocalTracks = track;

  for (let i = 0; i < localTracks.length; i++) {
    track.addEventListener(
      JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
      (audioLevel) => console.log(`Audio Level local: ${audioLevel}`)
    );
    track.addEventListener(
      JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
      () => console.log('local track muted')
    );
    track.addEventListener(
      JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
      () => console.log('local track stopped')
    );
    track.addEventListener(
      JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
      (deviceId) =>
        console.log(`track audio output device was changed to ${deviceId}`)
    );
    if (isJoined) {
      room.addTrack(track);
    }

    return null;
  };
}

function LocalTracksAttach(track){
const videoRef = useRef(null);
const audioRef = useRef(null);

useEffect(()=>{
    if (track.getType() === 'video') {
   if (localVideo) {
      track.attach(videoRef.current);
    }
  } else {
    // Assuming you have an <audio> element with the ID 'localAudio' created in your JSX.
    if (localAudio) {
      track.attach(audioRef.current);
    }
}
}, []);
  if (track.getType() === 'video') {
   if (localVideo) {
      track.attach(videoRef.current);
    }
  } else {
    // Assuming you have an <audio> element with the ID 'localAudio' created in your JSX.
    if (localAudio) {
      track.attach(audioRef.current);
    }
}
}
/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
    if (track.isLocal()) {
        return;
    }
    const participant = track.getParticipantId();

    if (!remoteTracks[participant]) {
        remoteTracks[participant] = [];
        setRemoteTracks({ ...remoteTracks });
    }
    const idx = remoteTracks[participant].push(track);

    track.addEventListener(
        JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
    track.addEventListener(
        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
        () => console.log('remote track muted'));
    track.addEventListener(
        JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
        () => console.log('remote track stoped'));
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
        deviceId =>
            console.log(
                `track audio output device was changed to ${deviceId}`));
    const id = participant + track.getType() + idx;

    if (track.getType() === 'video') {
        <video autoplay='1' id='${participant}video${idx}' />;
    } else {
        <audio autoplay='1' id='${participant}audio${idx}' />;
    }
    track.attach($(`#${id}`)[0]);
}




/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined() {
    console.log('conference joined!');
    isJoined = true;
    for (let i = 0; i < setLocalTracks.length; i++) {
        room.addTrack(setLocalTracks[i]);
    }
}

/**
 *
 * @param id
 */
function onUserLeft(id) {
    console.log('user left');
    if (!remoteTracks[id]) {
        return;
    }
    const tracks = remoteTracks[id];

    for (let i = 0; i < tracks.length; i++) {
        tracks[i].detach($(`#${id}${tracks[i].getType()}`));
    }
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess() {
    room = connection.initJitsiConference('conference', confOptions);
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
        console.log(`track removed!!!${track}`);
    });
    room.on(
        JitsiMeetJS.events.conference.CONFERENCE_JOINED,
        onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.USER_JOINED, id => {
        console.log('user join');
        remoteTracks[id] = [];
    });
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
        console.log(`${track.getType()} - ${track.isMuted()}`);
    });
    room.on(
        JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
        (userID, displayName) => console.log(`${userID} - ${displayName}`));
    room.on(
        JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
        (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
    room.on(
        JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
        () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
    room.join();
}

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed() {
    console.error('Connection Failed!');
}

/**
 * This function is called when the connection fail.
 */
function onDeviceListChanged(devices) {
    console.info('current devices', devices);
}

/**
 * This function is called when we disconnect.
 */
function disconnect() {
    console.log('disconnect!');
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        onConnectionSuccess);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_FAILED,
        onConnectionFailed);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
        disconnect);
}

/**
 *
 */
function unload() {
    for (let i = 0; i < setLocalTracks.length; i++) {
        setLocalTracks[i].dispose();
    }
    room.leave();
    connection.disconnect();
}

let isVideo = true;

/**
 *
 */
function switchVideo() { // eslint-disable-line no-unused-vars
    isVideo = !isVideo;
    if (setLocalTracks[1]) {
        setLocalTracks[1].dispose();
        setLocalTracks.pop();
    }
    JitsiMeetJS.createLocalTracks({
        devices: [ isVideo ? 'video' : 'desktop' ]
    })
        .then(tracks => {
            setLocalTracks.push(tracks[0]);
            setLocalTracks[1].addEventListener(
                JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
                () => console.log('local track muted'));
            setLocalTracks[1].addEventListener(
                JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
                () => console.log('local track stoped'));
            setLocalTracks[1].attach($('#localVideo1')[0]);
            room.addTrack(setLocalTracks[1]);
        })
        .catch(error => console.log(error));
}

/**
 *
 * @param selected
 */
function changeAudioOutput(selected) { // eslint-disable-line no-unused-vars
    JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
}

window.addEventListener("beforeunload", unload);
window.addEventListener("unload", unload);

// JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
const initOptions = {
    disableAudioLevels: true
};

JitsiMeetJS.init(initOptions);

connection = new JitsiMeetJS.JitsiConnection(null, null, options);

connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
    onConnectionSuccess);
connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_FAILED,
    onConnectionFailed);
connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
    disconnect);

JitsiMeetJS.mediaDevices.addEventListener(
    JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
    onDeviceListChanged);

connection.connect();

JitsiMeetJS.createLocalTracks({ devices: [ 'audio', 'video' ] })
    .then(onLocalTracks)
    .catch(error => {
        throw error;
    });

if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
    JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
        const audioOutputDevices
            = devices.filter(d => d.kind === 'audiooutput');

        if (audioOutputDevices.length > 1) {
            $('#audioOutputSelect').html(
                audioOutputDevices
                    .map(
                        d =>
                            `<option value="${d.deviceId}">${d.label}</option>`)
                    .join('\n'));

            $('#audioOutputSelectWrapper').show();
        }
    });
}
return (
    <div>
        <div>
        {localTracks.map((track, i) => {
          if (track.getType() === 'video') {
            return <video ref={(videoRef) => (videoRefs[i] = videoref.current)} autoPlay='1' key={`localVideo${i}`} />;
          } else {
            return <audio ref={(audioRef) => (audioRefs[i] = audioref.current)} autoPlay='1' muted='true' key={`localAudio${i}`} />;
          }
        })}

        {/* Map through the remote participant video and audio tracks */}
        {remoteParticipants.map((participant, idx) => (
          <div key={`participant${idx}`}>
            <video ref={(videoRef) => (videoRefs[`participant${idx}`] = videoref.current)} autoPlay='1' id={`${participant}video${idx}`} />
            <audio ref={(audioRef) => (audioRefs[`participant${idx}`] = audioref.current)} autoPlay='1' id={`${participant}audio${idx}`} />
          </div>
        ))}
        </div> 
    <Link href="#" onClick={unload}>Unload</Link>
    <Link href="#" onClick={switchVideo}>Switch Video</Link>
    <div id="audioOutputSelectWrapper" style={audioOutputSelectWrapperStyle}>
        Change audio output device
        <select id="audioOutputSelect" onChange={handleAudioOutputChange}></select>
    </div>
    </div>
);
};

export default JitsiComponent;