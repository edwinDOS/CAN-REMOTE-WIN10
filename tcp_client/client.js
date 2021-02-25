const net = require('net');

//const MAX_BUFF_LENGTH = 0xfffffff;
const MAX_BUFF_LENGTH = 0xf;

class TCPClient {
  constructor() {
    this.client = null;
    this.bufList = [];
    this.totalLenth = 0;
    this.dataHandler = () => {
      console.log('buffer list', this.bufList);
      console.log('buffer total length', this.totalLenth);
    };
    this.addr = '192.168.82.246';
    this.port = '30000';
    console.log('Setting IP');
  }

  // setup client
  setupClient(addr, port) {
    if (this.client && !this.client.destroyed) {
      this.client.destroy();
      console.log('Setting IP error');
    }
    this.addr = addr;
    this.port = port;
    console.log('Setting IP sended');
  }
  // callback of receive data
  onReceiveData(buff) {
    try {
      if (this.totalLenth + buff.length > MAX_BUFF_LENGTH) {
        this.bufList.shift();
      }
      this.bufList.push(buff);
      this.totalLenth += buff.length;

      if (this.dataHandler) {
        this.dataHandler(this.bufList, this.totalLenth);
      }
    } catch (e) {
      this.bufList = [];
      this.totalLenth = 0;
      console.log(`Error on onReceiveData ${e.message}`); // eslint-disable-line no-console
    }
  }

  // init socket
  initConnToServer() {
    if (!this.client) {
      this.client = new net.Socket();
      this.client.on('data', (chunck) => {
        try {
          this.onReceiveData(chunck);
        } catch (e) {
          console.log('onDataError', e.message); // eslint-disable-line no-console
        }
      });
      if (!this.client.connecting) {
        this.client.connect(this.port, this.addr);
        console.log('Init-connect');
      }
    }

    if (this.client.destroyed) {
      this.client.connect(this.port, this.addr);
    }
  }

  sendToServer(requestObj) {
    if (!this.client || this.client.destroyed) {
      this.initConnToServer();
      console.log('InitConnToServer');
    }

    if (requestObj && requestObj.length > 0) {
      this.client.write(requestObj);
      console.log('Write');
    }
  }
}

const tcpClient = new TCPClient();

process.on('message', (m) => {
  try {
    switch (m.type) {
      case 'SETUP_CLIENT': {
        tcpClient.setupClient(m.payload.addr, m.payload.port);
        console.log('Setup-client');
        break;
      }
      case 'SEND_DATA': {
        if (!tcpClient.client || tcpClient.client.destroyed) {
          tcpClient.initConnToServer();
          console.log('send-data');
        }
        tcpClient.sendToServer(m.payload);
        break;
      }
      default:
        throw new Error('Unrecognized message received by tcp client');
    }
  } catch (e) {
    console.log(e); // eslint-disable-line no-console
  }
});
