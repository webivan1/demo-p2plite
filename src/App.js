import { P2PLite } from 'p2plite'
import signalhub from 'signalhub'

export default class App {

  constructor() {
    this.server = null;
    this.p2p = null;
    this.localStream = null;
    this.streams = [];
    this.username = null;
    this.colors = [
      ['text-white', 'bg-primary'],
      ['text-white', 'bg-success'],
      ['text-white', 'bg-danger'],
      ['text-white', 'bg-warning'],
      ['text-white', 'bg-info'],
      ['text-white', 'bg-dark'],
      ['bg-light']
    ];
  }

  run() {
    this.createServer();

    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: false
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
          this.removeVideo(item);
          this.streams.splice(key, 1);
        }
      });
    });

    let totalUsers = document.querySelector('.total-users');

    if (totalUsers) {
      setInterval(_ => {
        totalUsers.innerText = this.streams.length;
      }, 1000);
    }
  }

  removeVideo(item) {
    [].forEach.call(document.querySelectorAll('video[data-peer]'), elem => {
      if (item.user.getId() === elem.getAttribute('data-peer')) {
        $(elem).closest('.item-video').remove();
      }
    });
  }

  createVideoStream(item) {
    let video = document.createElement('video');
    video.srcObject = item.stream;
    video.setAttribute('data-peer', item.user.getId());
    video.style.width = '100%';
    video.play();

    let card = document.createElement('div');
    card.classList.add('card');

    let randomClasses = this.colors[Math.floor(Math.random() * this.colors.length)];
    randomClasses.forEach(className => card.classList.add(className));

    let cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');
    cardHeader.innerText = item.user.getParams().username;

    card.appendChild(cardHeader);

    let cardBlock = document.createElement('div');
    cardBlock.classList.add('card-body');
    cardBlock.appendChild(video);

    card.appendChild(cardBlock);

    let col = document.createElement('div');
    col.classList.add('item-video');
    col.classList.add('col-md-3');
    col.classList.add('col-sm-4');
    col.classList.add('col-xs-6');

    col.appendChild(card);

    let container = document.querySelector('.peer-video');

    if (container) {
      container.appendChild(col);
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