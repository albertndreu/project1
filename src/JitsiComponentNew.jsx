import { useRef, useState, useEffect} from "react";

const options = {
	hosts: {
		domain: 'jitsi-meet.example.com',
		muc: 'conference.jitsi-meet.example.com'
	},
	bosh: '//jitsi-meet.example.com/http-bind'
};

const confOptions = {};
const initOptions = {
	disableAudioLevels: true
};


const JitsiComponentNew = () => {
	const [connection, setConnection] = useState(null);
	const [isJoined, setIsJoined] = useState(false);
	const [room, setRoom] = useState(null);

	const [localTracks, setLocalTracks] = useState([]);
	const [remoteTracks, setRemoteTracks] = useState({});

	const localVideoRef = useRef()
	const localAudioRef = useRef()

	useEffect(() => {
		initJitsi()
	}, []);

	useEffect(() => {
		// if (newLocalTracks[i].getType() === 'video') {
			// 	$('body').append(`<video autoplay='1' id='localVideo${i}' />`);
			// 	newLocalTracks[i].attach($(`#localVideo${i}`)[0]);
			// } else {
			// 	$('body').append(
			// 		`<audio autoplay='1' muted='true' id='localAudio${i}' />`);
			// 	newLocalTracks[i].attach($(`#localAudio${i}`)[0]);
			// }
		console.log("localVideoRef.current", localVideoRef.current)
		console.log("localAudioRef.current", localAudioRef.current)

		// if (track.getType() === 'video') {
		// 	if (localVideo) {
		// 		track.attach(videoRef.current);
		// 	}
		// } else {
		// 	// Assuming you have an <audio> element with the ID 'localAudio' created in your JSX.
		// 	if (localAudio) {
		// 		track.attach(audioRef.current);
		// 	}
		// }
	}, []);

	const unload = () => {
		for (let i = 0; i < localTracks.length; i++) {
			localTracks[i].dispose();
		}
		room.leave();
		connection.disconnect();
	}


	const initJitsi = () => {
		window.addEventListener("beforeunload", unload);
		window.addEventListener("unload", unload);

		// JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
		const initOptions = {
			disableAudioLevels: true
		};

		JitsiMeetJS.init(initOptions);


		const newConnection = new JitsiMeetJS.JitsiConnection(null, null, options);

		newConnection.addEventListener(
			JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
			onConnectionSuccess);
		newConnection.addEventListener(
			JitsiMeetJS.events.connection.CONNECTION_FAILED,
			onConnectionFailed);
		newConnection.addEventListener(
			JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
			disconnect);

		JitsiMeetJS.mediaDevices.addEventListener(
			JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
			onDeviceListChanged);

		newConnection.connect();

		setConnection(newConnection)

		JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video'] })
			.then(onLocalTracks)
			.catch(error => {
				throw error;
			});

		// if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
		// 	JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
		// 		const audioOutputDevices
		// 			= devices.filter(d => d.kind === 'audiooutput');

		// 		if (audioOutputDevices.length > 1) {
		// 			$('#audioOutputSelect').html(
		// 				audioOutputDevices
		// 					.map(
		// 						d =>
		// 							`<option value="${d.deviceId}">${d.label}</option>`)
		// 					.join('\n'));

		// 			$('#audioOutputSelectWrapper').show();
		// 		}
		// 	});
		// }
	}

	const onConnectionSuccess = () => {
		const newRoom = connection.initJitsiConference('conference', confOptions);
		// newRoom.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
		// newRoom.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
		// 	console.log(`track removed!!!${track}`);
		// });
		newRoom.on(
			JitsiMeetJS.events.conference.CONFERENCE_JOINED,
			onConferenceJoined);
		newRoom.on(JitsiMeetJS.events.conference.USER_JOINED, id => {
			console.log('user join');
			remoteTracks[id] = [];
		});
		newRoom.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
		newRoom.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
			console.log(`${track.getType()} - ${track.isMuted()}`);
		});
		newRoom.on(
			JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
			(userID, displayName) => console.log(`${userID} - ${displayName}`));
		newRoom.on(
			JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
			(userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
		newRoom.on(
			JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
			() => console.log(`${newRoom.getPhoneNumber()} - ${newRoom.getPhonePin()}`));
		newRoom.join();
		setRoom(newRoom)
	}

	const onConferenceJoined = () => {
		console.log('conference joined!');
		setIsJoined(true)
		for (let i = 0; i < localTracks.length; i++) {
			room.addTrack(localTracks[i]);
		}
	}

	const onUserLeft = (id) => {
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
 * This function is called when the connection fail.
 */
	const onConnectionFailed = () => {
		console.error('Connection Failed!');
	}

	/**
	* This function is called when the connection fail.
	*/
	const onDeviceListChanged = (devices) => {
		console.info('current devices', devices);
	}

	/**
	* This function is called when we disconnect.
	*/
	const disconnect = () => {
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

	const onLocalTracks = (tracks) => {
		const newLocalTracks = tracks;
		for (let i = 0; i < newLocalTracks.length; i++) {
			newLocalTracks[i].addEventListener(
				JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
				audioLevel => console.log(`Audio Level local: ${audioLevel}`));
			newLocalTracks[i].addEventListener(
				JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
				() => console.log('local track muted'));
			newLocalTracks[i].addEventListener(
				JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
				() => console.log('local track stoped'));
			newLocalTracks[i].addEventListener(
				JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
				deviceId =>
					console.log(
						`track audio output device was changed to ${deviceId}`));
			// if (newLocalTracks[i].getType() === 'video') {
			// 	$('body').append(`<video autoplay='1' id='localVideo${i}' />`);
			// 	newLocalTracks[i].attach($(`#localVideo${i}`)[0]);
			// } else {
			// 	$('body').append(
			// 		`<audio autoplay='1' muted='true' id='localAudio${i}' />`);
			// 	newLocalTracks[i].attach($(`#localAudio${i}`)[0]);
			// }
			if (isJoined) {
				room.addTrack(newLocalTracks[i]);
			}
		}
	}

	return (
		<div>
			<h1> Jitsi Call Test </h1>
			<div>
				{localTracks.map( (track, index) => {
					if(track.getType() === 'video'){
						return <video ref={localVideoRef} autoPlay={1} key={i} />
					}
					else{
						return <audio ref={localAudioRef} autoPlay={1} muted='true' key={i} />
					}
				})}
			</div>
		</div>
	);
}
export default JitsiComponentNew; 
