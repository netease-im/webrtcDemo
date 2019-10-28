window.Netcall = window.WebRTC;
window.NIM = window.SDK.NIM;
NIM.use(WebRTC);
var hrt = document.documentElement.clientHeight
window.onload = function(){
  document.getElementById('app').style.height = hrt + 'px'
}


console.warn('浏览器信息: ', window.navigator.userAgent)
const WEBRTC_ENV = {
  appKey: "",
  token: ""
}

window.self = null

let app = new Vue({
  el: '#app',
  template: '#tpl',
  data: {
    /*页面元素的值*/
    account: '',
    password: '',
    calleeAccount: '',
    incomingCallDesc: 'xxx邀请你语音聊天',
    callingText: '正在呼叫，请稍后...',
    durationText: '00:00',
    callDurationDesc: '通话时长: 01:40',
    color3: '#00AA00',
    color5: '#00AA00',
    cameraOpen: true,
    micOpen: true,
    sliderNum: 10,

    /*sdk实例化对象*/
    nim: null,
    netcall: null,
    /*业务逻辑变量*/
    localVideoStream: null,
    callType: 'audio',
    toastTimer: null,
    callTimeoutTimer: null,
    callHintTimer: null,
    incomingCallTimeoutTimer: null,
    incomingCallHintTimer: null,
    incomingCallInfo: null, //该demo不考虑连续多人同时呼叫的场景，针对这种场景，用户可以根据自己的业务做相关逻辑
    callDurationTimer : null,
    currentPage: 'login',
    currentNetStatus: null,
    startTime: null,
    devices:{
      list: [],
      index: 0
    },

    /* 控制元素的展示 */
    //登录页面
    logoIcon: true,
    loginPage: true,
    //呼叫页面
    callPage: false,
    //呼叫中页面
    callingPage: false,
    preview: false,
    audioCallingDesc: false,
    videoCallingDesc: false,
    //通话页面
    calledPage: false,
    largeVideo: false,
    smallVideo: false,
    durationItem: false,
    networkItem: false,
    icon1: false,
    icon2: false,
    icon3: false,
    icon4: false,
    icon5: false,
    icon6: false,
    callDurationItem: false,
    slider: false,
    //来电页面
    incomingCallPage: false

  },
  methods: {
    login: function(){
      console.log('开始初始化 im sdk...');
      self = this
      this.nim = SDK.NIM.getInstance({
        debug: true,
        promise: true,
        appKey: WEBRTC_ENV.appKey,
        token: WEBRTC_ENV.token,
        account: this.account,
        syncTeamMembers: false,
        syncSessionUnread: true,
        shouldCountNotifyUnread: function (msg) {
          // 未接通来电统一计入未读数
          return msg.attach && msg.attach.type === 'netcallMiss'
        },
        onupdatesession: function (session) {
          console.log('会话更新了：', session)
        },
        onsessions: function (sessions) {
          console.log('收到会话', sessions)
        },
        onconnect: function() {
          console.log("im连接认证成功....")
        },
        onsyncdone: function(msg) {
          console.warn("同步完成，im登录流程完成")
          self.initWebrtc()
        },
        onroamingmsgs: function(msg) {
          console.log("收到 IM 消息 onroamingmsgs： ", msg)
        },
        onroamingsysmsgs: function(msg) {
          console.log("收到 IM 消息 onroamingsysmsgs ", msg)
        },
        onofflinesysmsgs: function(msg) {
          console.log("收到 IM 消息 onofflinesysmsgs ", msg)
        },
        onofflinemsgs: function(msg) {
          console.log("收到 IM 消息 onofflinemsgs： ", msg)
        },
        onmsg: function(msg) {
          console.log("收到 IM 消息： ", msg)
        },
        ondisconnect: function(error) {
          console.error("IM断开连接：", error)
          if (error.message == 'manually disconnect status' || error.message == 'done disconnect'){
            return
          } else if(!error.message) {
            error.message = '请使用其他账号'
          }

          alert(error.message)
          self.logout()
        },
        oncustomsysmsg: function(msg) {
          // 多端同步 正在输入自定义消息类型需要过滤
          console.log("收到------自定义通知：", msg)
        }
      })
    },

    logout: function () {
      console.warn('退出登录')
      this.nim.destroy({
        done: function (err) {
          console.log('im实例已被完全清除')
        }
      })

      this.netcall.destroy()
      console.log('音视频实例已被完全清除')

      self.currentPage = 'login'
      self.enterPreviousPage()
    },

    initWebrtc: function () {
      console.log('开始初始化 音视频 sdk...');
      this.netcall = window.WebRTC.getInstance({
        container: null, //本端视频展示的容器，不需要初始化的时候赋值
        remoteContainer: null, //远端视频展示的容器，不需要初始化的时候赋值
        chromeId: null, //演示功能是否使用插件
        debug: true,
        nim: this.nim
      })

      //监听sdk的事件
      this.netcall.on('beCalling', this.beCallingHandler)
      this.netcall.on('callRejected', this.callRejectedHandler)
      this.netcall.on('callAccepted', this.callAcceptedHandler)
      this.netcall.on('remoteTrack', this.remoteTrackHandler)
      this.netcall.on('hangup', this.hangupHandler)
      this.netcall.on('gatewayClosed', this.gatewayClosedHandler)
      this.netcall.on('error', this.errorHandler)
      this.netcall.on("netStatus", this.netStatus)
      console.log('登录完成，进入呼叫页面')
      //进入呼叫页面
      this.currentPage = 'call'
      this.logoIcon = false
      this.loginPage = false
      this.callPage = true
    },

    firestEnterCalledPage: function(){
      console.warn('进入通话页面, type: ', this.callType)
      //进入通话页面
      document.getElementById("rangeslider__handle").style.bottom = "70px"　
      this.sliderNum　= 10
      this.currentPage = 'called'
      this.durationText = '00:00'
      this.startTime = Date.now()
      this.incomingCallPage = false
      this.callingPage = false
      this.calledPage = true
      this.durationItem = true
      this.networkItem = true
      this.icon1 = true
      this.icon2 = true
      this.icon3 = true
      this.icon4 = true
      this.icon5 = true
      this.icon6 = true
      this.callDurationItem = false
      if (this.callType === 'audio') {
        console.warn('音频通话界面')
        this.$refs.networkDesc.style.color = '#000'
        this.$refs.durationDesc.style.color = '#000'
        this.largeVideo = false
        this.smallVideo = false
        document.getElementById('switch').style.backgroundColor = 'rgba(0,0,0,1)'
        document.getElementById('camera').style.backgroundColor = 'rgba(0,0,0,1)'
        document.getElementById('mic').style.backgroundColor = 'rgba(0, 166, 0, 1)'
        document.getElementById('loudspeaker').style.backgroundColor = 'rgba(0, 166, 0, 1)'
        document.getElementById('hangup').style.backgroundColor = 'rgba(255,0,0,1)'
      } else if (this.callType === 'video'){
        console.warn('视频通话界面')
        this.largeVideo = true
        this.smallVideo = true
        this.$refs.networkDesc.style.color = '#FFF'
        this.$refs.durationDesc.style.color = '#FFF'
        this.$refs.switch.style.backgroundColor = 'rgba(0,166,0,0.55)'
        this.$refs.camera.style.backgroundColor = 'rgba(0,166,0,0.55)'
        this.$refs.mic.style.backgroundColor = 'rgba(0,166,0,0.55)'
        this.$refs.loudspeaker.style.backgroundColor = 'rgba(0,166,0,0.55)'
        this.$refs.hangup.style.backgroundColor = 'rgba(255,0,0,0.55)'
      }

      //const self = this 
      this.callDurationTimer = setInterval(()=>{
        self.durationText = secondToDate(Date.now() - this.startTime)
      }, 1000)
    },

    beginMeidaCall: function() {
      this.netcall.startRtc()
        .then(data => {
          console.log("连接媒体网关成功: ", data)
          this.openTheMic().then(data=>{
            console.log('begin 开启mic成功')
            if (this.callType === 'video') {
              this.openTheCamera().then(data=>{
                console.log('begin 开启camera成功')
                this.firestEnterCalledPage()
              }).catch(error=>{
                console.error('begin 开启camera失败: ', error)
              })
            } else {
              this.firestEnterCalledPage()
            }
          }).catch(error=>{
            console.error('begin 开启mic失败: ', error)
          })
          
        })
        .catch(function(error) {
          console.error('连接媒体网关失败: ', error)
        })
    },

    audioCall: function() {
      this.callType = 'audio'
      this.call()
    },

    videoCall: function() {
      this.callType = 'video'
      this.call()
    },

    call: function() {
      console.log('%s呼叫%s', this.callType, this.calleeAccount)
      /*进入呼叫中页面*/
      this.currentPage = 'calling'
      this.callingText = '正在呼叫，请稍后...'
      this.callPage = false
      if (this.callType === 'audio') {
        this.$refs.audioCallingDesc.style.color = '#000'
        this.audioCallingDesc = true
        this.videoCallingDesc = false
        this.preview = false
      } else {
        this.$refs.videoCallingDesc.style.color = '#FFF'
        this.audioCallingDesc = false
        this.videoCallingDesc = true
        this.preview = true
        this.previewLocalCamera()
      }
      this.callingPage = true
      //启动呼叫超时定时器
      //const self = this
      this.callTimeoutTimer = setTimeout(()=>{
        console.log('超时无人接听，自动挂断')
        this.callingText = '无人接听'
        this.$refs.audioCallingDesc.style.color = 'red'
        self.callTimeoutTimer = null
        if (self.currentPage === 'calling') {
          self.cleanCallTimer()
          //const self = this
          setTimeout(()=>{
            //回到呼叫页面
            self.currentPage = 'call'
            self.enterPreviousPage()
          }, 2 * 1000)
        }
      }, 60 * 1000)

      this.netcall.call({
        type: this.callType === 'audio' ? Netcall.NETCALL_TYPE_AUDIO : Netcall.NETCALL_TYPE_VIDEO,
        account: this.calleeAccount,
        pushConfig: {}, //推送消息
        webrtcEnable: true,
        sessionConfig: {
          videoQuality: Netcall.CHAT_VIDEO_QUALITY_HIGH,
          videoFrameRate: Netcall.CHAT_VIDEO_FRAME_RATE_15,
          videoBitrate: 0,
          recordVideo: false,
          recordAudio: false,
          singleRecord: false,
          highAudio: false,
          rtmpUrl: "",
          rtmpRecord: false,
          splitMode: Netcall.LAYOUT_SPLITLATTICETILE
        }
      }).then(data=>{
        console.log("呼叫成功, data=%o", data);
      }).catch(error=>{
        console.error("呼叫失败，error=%o", error);
        

        this.callingText = '对方不在线'
        this.$refs.audioCallingDesc.style.color = 'red'
        this.$refs.videoCallingDesc.style.color = 'red'
        if (self.currentPage === 'calling') {
          self.cleanCallTimer()
          setTimeout(()=>{
            //回到呼叫页面
            self.currentPage = 'call'
            self.enterPreviousPage()
          }, 2 * 1000)
        }
      })
    },

    beCallingHandler: function(_data) {
      console.warn("===== 收到 beCalling 事件: ", _data);
      _data.type === 1 ? this.callType = 'audio' : this.callType = 'video'
      this.netcall.control({
        channelId: _data.channelId,
        command: Netcall.NETCALL_CONTROL_COMMAND_START_NOTIFY_RECEIVED
      })

      this.netcall.getDevicesOfType(Netcall.DEVICE_TYPE_VIDEO).then(data => {
        if(!data || data.length <= 0){
          console.log("没有获取到摄像头列表: ", data)
          return
        }
        console.warn("摄像头列表: ", data)
        this.devices.list = data
        this.devices.index = 0
      }).catch(error => {
          console.log("获取摄像头列表出错: ", error)
      })

      console.log('进入来电页面')
      this.incomingCallInfo = _data //后面的呼叫会覆盖前面的呼叫，不考虑连续来电的场景
      this.incomingCallDesc = _data.account + '邀请你' + (_data.type === 1 ? '音频' : '视频') + '聊天'
      this.logoIcon = false
      this.loginPage = false
      this.callPage = false
      this.callingPage = false
      this.calledPage = false
      this.incomingCallPage = true

      //启动超时定时器 
      this.incomingCallTimeoutTimer = setTimeout(()=>{
        console.log('超时未接听，自动挂断')
        this.incomingCallDesc = '未接听'
        self.incomingCallTimeoutTimer = null
        self.incomingCallHintTimer = setTimeout(()=>{
          self.incomingCallHintTimer = null
          console.log('挂断来电')
          self.ignore()
        }, 2 * 1000)
      }, 45 * 1000)
    },

    callRejectedHandler: function(_data) {
      console.log("===== 收到 callRejected 事件: ", _data)
      this.callingText = '对方已拒绝'
      this.$refs.audioCallingDesc.style.color = 'red'
        this.$refs.videoCallingDesc.style.color = 'red'
      if (this.currentPage === 'calling') {
        this.cleanCallTimer()
        //const self = this
        setTimeout(()=>{
          //回到呼叫页面
          self.currentPage = 'call'
          self.enterPreviousPage()
        }, 2 * 1000)
      }
    },

    callAcceptedHandler: function(_data) {
      console.log("===== 收到 callAccepted 事件: ", _data)
      this.cleanCallTimer()
      this.beginMeidaCall()
    },

    ignore: function() {
      if(this.incomingCallHintTimer) return

      this.cleanIncommingCallTimer()
      console.log("【拒绝】来电")
      this.netcall.control({
        channelId: this.incomingCallInfo.channelId, 
        command: Netcall.NETCALL_CONTROL_COMMAND_BUSY
      })
      this.netcall.response({
        accepted: false,
        beCalledInfo: this.incomingCallInfo 
      })
      // 回到之前的界面
      this.enterPreviousPage()
    },

    answer: function() {
      if(this.incomingCallHintTimer) return
      console.log("【接听】来电")
      this.cleanIncommingCallTimer()
      if(this.currentPage === 'called') {
        //先挂断当前通话
        this.netcall.hangup()
        setTimeout(()=>{
          //接听最近的来电，不考虑连续来电的场景
          this.netcall.response({
            accepted: true,
            beCalledInfo: this.incomingCallInfo,
            sessionConfig: {
              videoQuality: 0,
              videoFrameRate: 0,
              recordAudio: false,
              recordVideo: false,
              isHostSpeaker: false,
              recordType: 0
            }
          }).then(data => {
            console.log("接听成功, data=%o", data)
            //this.beginMeidaCall()
          })
          .catch(error=>{
            console.log("接听失败, error=%o", error)
            alert(error && error.event && error.event.message || '接听失败')
            self.cleanCallTimer()
            self.currentPage = 'call'
            self.enterPreviousPage()
          })
        }, 1 * 1000)
        return
      }
      
      //接听最近的来电，不考虑连续来电的场景
      this.netcall.response({
        accepted: true,
        beCalledInfo: this.incomingCallInfo,
        sessionConfig: {
          videoQuality: 0,
          videoFrameRate: 0,
          recordAudio: false,
          recordVideo: false,
          isHostSpeaker: false,
          recordType: 0
        }
      }).then(data => {
        console.log("接听成功, data=%o", data)
        //this.beginMeidaCall()
      })
      .catch(error=>{
        console.log("接听失败, error=%o", error)
        alert(error && error.event && error.event.message || '接听失败')
        self.cleanCallTimer()
        self.currentPage = 'call'
        self.enterPreviousPage()
      })
    },

    hangup: function() {
      console.log('自己挂断通话')
      clearInterval(this.callDurationTimer)
      this.netcall.hangup()
      this.slider = false
      if (this.currentPage === 'called') {
        this.durationItem = false
        this.networkItem = false
        this.callDurationDesc = '通话时长: ' + secondToDate(Date.now() - this.startTime)
        this.startTime = null
        this.callDurationItem = true
        //const self = this
        this.toastTimer = setTimeout(()=>{
          self.currentPage = 'call'
          self.enterPreviousPage()
          this.toastTimer = null
        }, 2 * 1000)
      }
    },

    hangupHandler: function(){
      console.log('对方挂断通话')
      clearInterval(this.callDurationTimer)
      this.netcall.hangup()
      this.slider = false
      if (this.currentPage === 'called') {
        this.networkItem = false
        this.callDurationDesc = '通话时长: ' + secondToDate(Date.now() - this.startTime)
        this.startTime = null
        this.callDurationItem = true
        //const self = this
        this.toastTimer = setTimeout(()=>{
          self.currentPage = 'call'
          self.enterPreviousPage()
          this.toastTimer = null
        }, 2 * 1000)
      }
    },

    previewLocalCamera: function() {
      console.log('预览本地视频画面')

      function videoPreview(device) {

        let constraint = {
          type: Netcall.DEVICE_TYPE_VIDEO
        }
        if (device) {
          constraint.device = device
        }
        return new Promise((resolve, reject) => {
          self.netcall.startVideoPreview(constraint).then(data => {
            console.warn('获取到视频流: ', data)
            let videoDom = self.$refs.preview.firstElementChild
            //自己进行播放，不借助sdk的接口
            // object-fit: fill; 该css属性 用于控制全屏，关于object-fit请参考https://developer.mozilla.org/zh-CN/docs/Web/CSS/object-fit
            videoDom.srcObject = data.stream
            videoDom.setAttribute('x-webkit-airplay', 'x-webkit-airplay')
            videoDom.setAttribute('playsinline', 'playsinline')
            videoDom.setAttribute('webkit-playsinline', 'webkit-playsinline')
            videoDom.preload = 'auto'
            videoDom.autoplay = 'autoplay'
            videoDom.muted = true

            videoDom.play().then((res)=>{
              console.warn('播放执行: ', res)
            }).catch(error=>{
              console.error('播放器执行失败: ', error)
            })
            return resolve()
            //sdk的播放接口  
            /*
            self.netcall.setLocalVideoRenderer({
              view: this.$refs.preview
            })
            self.netcall.setLocalRenderMode({
              width: document.body.clientWidth || document.documentElement.clientWidth,
              height: document.body.clientHeight || document.documentElement.clientHeight,
              cut: true
            })*/
          }).catch(error => {
            console.log("获取视频流出错: ", error)
            reject(error)
          })
        })
      }

      if (this.devices.list.length) {
        console.log("获取摄像头 %s 的画面", this.devices.list[this.devices.index])
        videoPreview(this.devices.list[this.devices.index])
        return
      } else if(_isSafari()) {
        //Safari浏览器比较特殊，需要请求过一次设备之后，才能获取到完整的设备列表
        videoPreview().then(()=>{
          this.netcall.getDevicesOfType(Netcall.DEVICE_TYPE_VIDEO).then(data => {
            if(!data || data.length <= 0){
              console.log("没有获取到摄像头列表: ", data)
              return
            }
            console.warn("摄像头列表: ", data)
            this.devices.list = data
            this.devices.index = 0
          }).catch(error => {
              console.log("获取摄像头列表出错: ", error)
          })
        }).catch(()=>{

        })
      } else {
        this.netcall.getDevicesOfType(Netcall.DEVICE_TYPE_VIDEO).then(data => {
          if(!data || data.length <= 0){
            console.log("没有获取到摄像头列表: ", data)
            return
          }
          console.warn("摄像头列表: ", data)
          this.devices.list = data
          this.devices.index = 0
          console.log("获取摄像头 %s 的画面", this.devices.list[this.devices.index])
          videoPreview(this.devices.list[this.devices.index])
        }).catch(error => {
            console.log("获取摄像头列表出错: ", error)
        })
      } 
    },

    openTheMic: function() {
      if(this.toastTimer) return

      console.log('开启mic')
      return new Promise((resolve, reject) => {
        this.netcall.startDevice({
          type: Netcall.DEVICE_TYPE_AUDIO_IN
        })
        .then(res => {
          console.log('开启 mic 成功')
          this.micOpen = false
          if (this.callType === 'audio') {
            document.getElementById('mic').style.backgroundColor = 'rgba(0,166,0,1)'
          } else {
            document.getElementById('mic').style.backgroundColor = 'rgba(0,166,0,0.55)'
          }
          return resolve()
        })
        .catch(function(error) {
          console.log('开启mic失败: ', error);
          reject(error)
        })
      })
    },

    closeTheMic: function() {
      if(this.toastTimer) return
      console.log('关闭mic')
      this.netcall.stopDevice(Netcall.DEVICE_TYPE_AUDIO_IN)
        .then(data => {
          console.log('关闭 mic 成功')
          document.getElementById('mic').style.backgroundColor = 'rgba(0,0,0,0.55)'
          this.micOpen = true
        })
        .catch(function(error) {
          console.log('关闭 mic 出错: ', error)
        })
    },

    openTheCamera: function() {
      if(this.toastTimer || this.callType === 'audio') return

      console.warn('开启摄像头')
      console.warn('devices.list: ', this.devices.list)
      console.warn('devices.index: ', this.devices.index)

      return new Promise((resolve, reject) => {
        this.netcall.startDevice({
          type: WebRTC.DEVICE_TYPE_VIDEO,
          device: this.devices.list[this.devices.index]
          /*
          {
            deviceId: this.devices.list[this.devices.index]
          }*/
        })
        .then(_data => {
          console.warn('开启 camera 成功: ', _data)
          // 自己进行播放，不借助sdk的接口
          // object-fit: fill; 该css属性 用于控制全屏，关于object-fit请参考https://developer.mozilla.org/zh-CN/docs/Web/CSS/object-fit
          let videoDom = self.$refs.small.firstElementChild
          videoDom.srcObject = self.netcall.adapterRef.videoHelperLocal.localCameraStream

          videoDom.setAttribute('x-webkit-airplay', 'x-webkit-airplay')
          videoDom.setAttribute('playsinline', 'playsinline')
          videoDom.setAttribute('webkit-playsinline', 'webkit-playsinline')
          videoDom.preload = 'auto'
          videoDom.autoplay = 'autoplay'
          videoDom.muted = true

          videoDom.play().then(()=>{
            console.warn('播放执行')
          }).catch(error=>{
            console.error('播放器执行失败: ', error)
          })
          self.cameraOpen = false
          document.getElementById('camera').style.backgroundColor = 'rgba(0,166,0,0.55)'
          
          if (_isSafari() && self.devices.list.length && !self.devices.list[0].deviceId) {
            //Safari浏览器比较特殊，需要请求过一次设备之后，才能获取到完整的设备列表
            self.netcall.getDevicesOfType(Netcall.DEVICE_TYPE_VIDEO).then(data => {
              if(!data || data.length <= 0){
                console.log("没有获取到摄像头列表: ", data)
                return
              }
              console.warn("摄像头列表: ", data)
              self.devices.list = data
              self.devices.index = 0
            }).catch(error => {
                console.log("获取摄像头列表出错: ", error)
            })
          }
          resolve()
          
          //sdk的内部播放接口
          /*
          this.netcall.setLocalVideoRenderer({
            view: this.$refs.small
          })
          this.netcall.setLocalRenderMode({
            width: document.getElementById('small').clientWidth,
            height: document.getElementById('small').clientHeight,
            cut: true
          })
          */
        })
        .catch(function(error) {
          console.error('开启 camera 出错: ', error)
        })
      })
    },

    closeTheCamera: function() {
      if(this.toastTimer || this.callType === 'audio') return

      console.log('关闭摄像头')
      this.netcall.stopDevice(Netcall.DEVICE_TYPE_VIDEO)
        .then(()=>{
          console.log('关闭 camera 成功')
          document.getElementById('camera').style.backgroundColor = 'rgba(0,0,0,0.55)'
          this.cameraOpen = true
        })
        .catch(function(error) {
          console.log('关闭 camera 出错: ', error)
        })
    },

    switchTheCamera: function() {
      if(this.toastTimer || this.callType === 'audio') return
      console.log('切换摄像头')
      this.netcall.stopDevice(Netcall.DEVICE_TYPE_VIDEO)
        .then(()=>{
          console.log('先关闭 camera 成功')
          console.warn('list: ', this.devices.list)
          console.warn('index: ', this.devices.index)
          if(++this.devices.index >= this.devices.list.length) {
            this.devices.index = 0
          }
          this.netcall.startDevice({
            type: WebRTC.DEVICE_TYPE_VIDEO,
              device: this.devices.list[this.devices.index]
            })
            .then(_data => {
              console.log('开启 camera 成功: ', _data)
              self.$refs.small.firstElementChild.srcObject = self.netcall.adapterRef.videoHelperLocal.localCameraStream
            })
            .catch(function(error) {
              console.error('开启 camera 出错: ', error)
              self.switchTheCamera()
            })
        })
        .catch(function(error) {
          console.log('关闭 camera 出错: ', error)
        })
    },
    loudspeaker: function(){
      if (this.toastTimer) return
      if (this.slider) {
        this.slider = false
        return
      } 
      console.log('设置对端音量')
      this.slider = true

      var box = document.getElementById("rangeslider__handle")
      var x, y;
      var isDrop = false;


      box.ontouchstart = box.onmousedown = function(e) {
        var e = e || window.event;
        console.warn('e: ', e)
        console.warn('box: ', box)
        if(_isIOS()) {
          console.warn('ios平台, y: ', e.layerY)
          console.warn('bak: ', e.pageY)
          y = e.layerY
        } else if(_isAndroid()) {
          console.warn('安卓平台')
          y = e.touches && e.touches.length && e.touches[0].pageY
        } else {
          console.warn('pc平台')
          y = e.clientY - box.offsetTop;
        }
        console.log('上下移动了: ', y)
        isDrop = true;
      }

      box.ontouchmove = box.onmousemove = function(e) {              　　　　　　　　　　　 　　　　　　　
        if(isDrop) {
            console.warn('ontouchmove e: ', e)　　　　
            var e = e || window.event;
            var clientY;

            if(_isIOS()) {
              console.warn('ios平台')
              clientY = e.layerY 
            } else if(_isAndroid()) {
              console.warn('安卓平台')
              clientY = e.touches && e.touches.length && e.touches[0].pageY
            } else {
              console.warn('pc平台')
              clientY = e.clientY
            }
           　　               　　
            var moveY = clientY - y;
            var maxY = 70 || document.documentElement.clientHeight - box.offsetHeight;
            moveY = Math.min(maxY, Math.max(0,moveY));
            console.warn('y轴 取值:', moveY)
            box.style.top = moveY + "px";　　
            self.sliderNum　= Math.round((70-moveY)/7)
        } else {
            return;　　　　　　　　　　
        }
      }

      box.ontouchend = box.onmouseup = function() {
        console.warn('鼠标松开了,设置的音量是: ', self.sliderNum)
        self.netcall.setPlayVolume(Math.round(self.sliderNum * 255 / 10 ), self.calleeAccount)
        isDrop = false; 
      }
    },

    swapPlaces: function(){
      console.warn('交换视频窗口')
      this.$refs.small.firstElementChild.srcObject = [this.$refs.large.firstElementChild.srcObject , this.$refs.large.firstElementChild.srcObject = this.$refs.small.firstElementChild.srcObject][0]
    },

    remoteTrackHandler: function(_data) {
      console.log('===== 收到remoteTrack事件: ', _data);
      if (_data && _data.track && _data.track.kind == 'audio') {
        console.log('开始播放 %s 声音', _data.account)
        this.netcall.startDevice({
          type: Netcall.DEVICE_TYPE_AUDIO_OUT_CHAT
        }).then(obj => {
          console.log('成功播放 %s 声音', _data.account)
        }).catch(err => {
          console.log('成功播放 %s 声音 %o', _data.account, err)
        })
      } else if(_data && _data.track && _data.track.kind == 'video') {
        console.warn('开始播放 %s 画面', _data.account)
        //应用层自己播放视频
        let videoStream = new MediaStream()
        videoStream.addTrack(_data.track)
        let videoDom = self.$refs.large.firstElementChild
        videoDom.setAttribute('x-webkit-airplay', 'x-webkit-airplay')
        videoDom.setAttribute('playsinline', 'playsinline')
        videoDom.setAttribute('webkit-playsinline', 'webkit-playsinline')
        videoDom.preload = 'auto'
        videoDom.autoplay = 'autoplay'
        videoDom.muted = true
        videoDom.srcObject = videoStream

        videoDom.play().then(()=>{
          console.warn('播放执行')
        }).catch(error=>{
          console.error('播放器执行失败: ', error)
        })

        //sdk的内部播放接口
        /*
        this.netcall.startRemoteStream({
          account: _data.account,
          node: this.$refs.large
        })
        this.netcall.setVideoViewRemoteSize({
          width: document.getElementById('large').clientWidth,
          height: document.getElementById('large').clientHeight,
          cut: true
        })
        */
      }
    },

    enterPreviousPage: function() {
      console.log('之前的页面: ', this.currentPage)
      if (this.currentPage == 'call') {
        //进入呼叫页面
        this.callPage = true
        this.callingPage = false
        this.calledPage = false
        this.incomingCallPage = false
      } else if (this.currentPage === 'calling'){
        //进入呼叫中页面
        this.callPage = false
        this.callingPage = true
        this.calledPage = false
        this.incomingCallPage = false
      } else if (this.currentPage === 'called') {
        //进入通话页面
        this.callPage = false
        this.callingPage = false
        this.calledPage = true
        this.incomingCallPage = false
      }  else if (this.currentPage === 'login') {
        //进入登录页面
        this.logoIcon = true
        this.loginPage = true
        this.callPage = false
        this.callingPage = false
        this.calledPage = false
        this.incomingCallPage = false
      } 
    },

    netStatus: function(obj) {
      if(this.currentNetStatus === null) {
        currentNetStatus = obj.quality
      } else if(currentNetStatus === obj.quality) {
        return
      } else {
        currentNetStatus = obj.quality
      }

      switch (obj.quality) {
        case WebRTC.CHAT_NET_STATUS_VERY_GOOD:
          this.icon1 = true
          this.icon2 = true
          this.icon3 = true
          this.icon4 = true
          this.icon5 = true
          this.icon6 = true
          this.color3 = '#00AA00'
          this.color5 = '#00AA00'
          break
        case WebRTC.CHAT_NET_STATUS_GOOD:
          this.icon1 = false
          this.icon2 = false
          this.icon3 = true
          this.icon4 = true
          this.icon5 = true
          this.icon6 = true
          this.color3 = '#FFCC33'
          this.color5 = '#FFCC33'
          break
        case WebRTC.CHAT_NET_STATUS_POOR:
        case WebRTC.CHAT_NET_STATUS_BAD:
          this.icon1 = false
          this.icon2 = false
          this.icon3 = false
          this.icon4 = false
          this.icon5 = true
          this.icon6 = true
          this.color5 = '#CC0000'
          break
      }
    },

    cleanCallTimer() {
      if (this.callTimeoutTimer) {
        clearTimeout(this.callTimeoutTimer) 
        this.callTimeoutTimer = null
      }
      if (this.callHintTimer) {
        clearTimeout(this.callHintTimer) 
        this.callHintTimer = null
      }
    },

    cleanIncommingCallTimer() {
      if (this.incomingCallTimeoutTimer) {
        clearTimeout(this.incomingCallTimeoutTimer) 
        this.incomingCallTimeoutTimer = null
      }
      if (this.incomingCallHintTimer) {
        clearTimeout(this.incomingCallHintTimer) 
        this.incomingCallHintTimer = null
      }
    }
  }
})


function secondToDate(result) {
  if (result <=0 ) {
    return "00:00:00"
  }
  result = result / 1000
  let h = Math.floor(result / 3600) < 10 ? '0'+Math.floor(result / 3600) : Math.floor(result / 3600);
  let m = Math.floor((result / 60 % 60)) < 10 ? '0' + Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60));
  let s = Math.floor((result % 60)) < 10 ? '0' + Math.floor((result % 60)) : Math.floor((result % 60));
  if (h > 0) {
    return result = h + ":" + m + ":" + s;
  } else {
    return result = m + ":" + s;
  }
}

function _isSafari () {
  return /^((?!chrome).)*safari((?!chrome).)*$/gi.test(navigator.userAgent)
}

function _isAndroid () {
  return /Android/i.test(navigator.userAgent)
}

function _isIOS () {
  console.warn('userAgent: ', navigator.userAgent)
  return /webOS|iPhone|iPod|iOS/i.test(navigator.userAgent)
}



