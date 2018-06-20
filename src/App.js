import { P2PLite } from 'p2plite'
import signalhub from 'signalhub'

export default class App {

  constructor() {
    this.server = null;
    this.p2p = null;
    this.localStream = null;
    this.streams = [];
    this.username = null;
  }

  run() {
    this.createServer();

    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true
      })
      .then(stream => {
        this.localStream = stream;
        this.setLocalVideo();
        this.username = prompt('What is your name?', 'Guest');
        this.createConnection();
      })
      .catch(err => alert(err.message));
  }

  createServer() {
    this.server = signalhub('p2p', [
      window.location.protocol + '//' + window.location.hostname + ':3000'
    ]);
  }

  createConnection() {
    this.p2p = new P2PLite(this.server, this.localStream, {
      params: {
        username: this.username
      }
    });

    this.p2p.onSignal(peer => {
      if (peer.getId() !== this.p2p.getUser().getId()) {
        peer.call(true);
      }
    });

    this.p2p.onStream(peer => {
      let item = {
        user: peer,
        stream: peer.getStream()
      };

      this.streams.push(item);

      this.createVideoStream(item);
    });

    this.p2p.onClose(id => {
      this.streams.forEach((item, key) => {
        if (item.user.getId() === id) {
          this.streams.splice(key, 1);
        }
      });
    });
  }

  createVideoStream(item) {
    console.log('Create stream', item);

    let video = document.createElement('video');
    video.srcObject = item.stream;
    video.setAttribute('data-peer', item.user.getId());
    video.play();

    let wrapper = document.createElement('div');
    wrapper.classList.add('col');
    wrapper.insertNode(video);

    let container = document.querySelector('.peer-video');

    if (container) {
      container.appendChild(wrapper);
    }
  }

  setLocalVideo() {
    let video = document.querySelector('.local-video');

    if (video) {
      video.srcObject = this.localStream;
      video.play();
    }
  }
}