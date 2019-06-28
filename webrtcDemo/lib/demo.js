
window.nim = null
window.netcall = null
window.WebRTC = window.WebRTC
window.NIM = window.SDK.NIM
NIM.use(WebRTC)

//临时变量
let currentData = {
  imHasLogined: false, //是否登录 
  isCalling: false, //正在呼叫中
  onThePhone: false, //正在通话中
  incomingCall: false, //收到来电
  localAccount: '',
  remoteAccount: ''
}

var callerList = $('#callerList').get(0) //来电列表 
var callerListInfo = {} //来电信息列表

window.onload=function (){
}
// 添加日志
function addLog(info) {
  var temp = JSON.stringify(info)
  let innerHTML = `<p>${temp}</p>` + $('#debug-content').html()
  $('#debug-content').html(innerHTML)
}

$('#clear-btn').click(function(event) {
  $('#debug-content').html('')
})

/** 
 * ----------------------------------------
 *              登录
 * ----------------------------------------
 */
$('#login-btn').click(function(){
  console.log('【登录】点击...')
  if (nim) {
    console.log('已经登录，无需再登录')
    addLog('已经登录，无需再登录')
    return
  }

  const appkey = $('#appkey')
  const token = $('#token')
  const caller = $('#caller')

  if (!appkey.val() || $.trim(appkey.val()).length ===0) {
    alert("请输入appkey")
    appkey.focus()
    return
  } else if (!token.val() || $.trim(token.val()).length ===0) {
    alert("请输入token")
    token.focus()
    return
  } else if (!caller.val() || $.trim(caller.val()).length ===0) {
    alert("请输入账号")
    caller.focus()
    return
  }

  //初始化im sdk
  nim = NIM.getInstance({
    debug: true,
    promise: true,
    appKey: appkey.val(),
    token: token.val(),
    account: caller.val(),
    syncTeamMembers: false,
    onconnect: function() {
      console.log("im连接认证成功....")
    },
    onsyncdone: function(msg) {
      console.warn("同步完成")
      addLog("im登录成功....")
      currentData.imHasLogined = true
      currentData.localAccount = caller.val()
      //初始化音视频sdk
      initNetcall()
    },
    onmsg: function(msg) {
      var msg = msg
      console.log("收到 IM 消息： ", msg)
    },
    ondisconnect: function(error) {
      console.error("IM断开连接：", error)
      addLog("IM断开连接....")
      currentData.imHasLogined = false
      nim = null
      alert(error.message)
    },
    oncustomsysmsg: function(msg) {
      // 多端同步 正在输入自定义消息类型需要过滤
      var content = JSON.parse(msg.content)
      var id = content.id
      if (id == 1) {
        return;
      }
      console.log("收到------自定义通知：", msg);
    }
  })
})
 
//初始化音视频sdk
function initNetcall() {

  netcall = window.WebRTC.getInstance({
    container: null,
    remoteContainer: null,
    chromeId: null,
    debug: true,
    nim: nim
  })

  netcall.on('remoteTrack', remoteTrack)
  netcall.on('beCalling', beCalling)
  netcall.on('callRejected', callRejected)
  netcall.on('callAccepted', callAccepted)
  netcall.on('hangup', hangup)
  
  syncDeviceList()
}

/** 
 * ----------------------------------------
 *              点对点呼叫
 * ----------------------------------------
 */

//呼叫
$('#call-btn').click(function(event) {
  if (!currentData.imHasLogined) {
    console.warn("nim尚未登录成功，请先登录...")
    addLog("nim尚未登录成功，请先登录...")
    return
  } else if (currentData.isCalling) {
    console.warn( "正在呼叫: " + $('#callee').val() + ' 中, 请先挂断当前的呼叫')
    addLog( "正在呼叫: " + $('#callee').val() + ' 中, 请先挂断当前的呼叫')
    return
  } else if (currentData.onThePhone) {
    console.error("正在和 " + $('#callee').val() + ' 通话中, 请先挂断当前通话')
    addLog("正在和 " + $('#callee').val() + ' 通话中, 请先挂断当前通话')
    return
  } else if (!$('#callee').val() || $.trim($('#callee').val()).length ===0) {
    alert("请输入被叫账号")
    $('#calle').focus()
    return
  }

  console.log("【呼叫】点击...")
  netcall.call({
    type: WebRTC.NETCALL_TYPE_VIDEO, //通话模式
    account: $('#callee').val(),
    pushConfig: {
      enable: true,
      needBadge: true,
      needPushNick: true,
      pushContent: '',
      custom: '',
      pushPayload: '',
      sound: false,
      forceKeepCalling: true //是否持续呼叫
    }, 
    sessionConfig: {
      videoQuality: 0,
      videoFrameRate: 0,
      highAudio: false,
      recordAudio: false,
      recordVideo: false,
      isHostSpeaker: false,
      recordType: 0,
      rtmpUrl: '',
      splitMode: 0,
      layout: 0,
      liveEnable: false,
      rtmpRecord: false
    },
    webrtcEnable: true
  }).then(obj=>{
    console.log("呼叫成功: ", obj)
    currentData.isCalling = true
    addLog("呼叫成功")
  }).catch(err=>{
    console.error("呼叫失败: ", err)
    addLog("呼叫失败")
  })
})

$('#hangup-btn').click(function(){
  if (!currentData.onThePhone && !currentData.isCalling) {
    console.warn('当前没有通话，无法挂断')
    addLog('当前没有通话，无法挂断')
    return
  }
  const account = $('#callee').val() || currentData.remoteAccount
  console.log("【挂断】点击: ", account)
  addLog("【挂断】点击: " + account)
  cleanSession(account)
})

$('#accept-btn').click(function(event) {
  if(callerList.length === 0) {
    console.warn("没有来电，无法接听")
    addLog("没有来电，无法接听")
    return
  } else if (currentData.isCalling && $('#callee').val() == callerList.value) {
    console.warn("正在呼叫对方，不可接听...")
    addLog("正在呼叫对方，不可接听...")
    return
  } else if (currentData.onThePhone) {
    console.warn("已经建立通话，不可接听...")
    addLog("已经建立通话，不可接听...")
    return
  }

  console.log("【接听】点击： ", callerList.value)
  netcall.response({
    accepted: true,
    beCalledInfo: callerListInfo[callerList.value],
    sessionConfig: {
      videoQuality: 0,
      videoFrameRate: 0,
      recordAudio: false,
      recordVideo: false,
      isHostSpeaker: false,
      recordType: 0
    }
  }).then(function(data) {
    console.log("接听成功, data=%o", data)
    addLog("接听成功")
  })
  .catch(function(error) {
    console.log("接听失败, error=%o", error)
    addLog("接听失败")
  })
})


$('#reject-btn').click(function(event) {
  if(callerList.length === 0) {
    addLog("没有来电，无法拒绝")
    return;
  } else if (currentData.onThePhone && currentData.remoteAccount == callerList.value) {
    console.log("正在与对方通话中，不可点击拒绝，请选择挂断")
    addLog("正在与对方通话中，不可点击拒绝，请选择挂断")
    return;
  }

  console.log("【拒绝】点击： ", callerList.value)

  netcall.control({
    channelId: callerListInfo[callerList.value].channelId, 
    command: WebRTC.NETCALL_CONTROL_COMMAND_BUSY
  })
  netcall.response({
    accepted: false,
    beCalledInfo: callerListInfo[callerList.value] 
  })
  
  delete callerListInfo[callerList.value]
  callerList.remove(callerList.value)
})


//收到呼叫
function beCalling(_data){
  console.warn("===== 收到 beCalling 事件: ", _data)
  addLog("收到呼叫：" + _data.account)
  netcall.control({
    channelId: _data.channelId,
    command: WebRTC.NETCALL_CONTROL_COMMAND_START_NOTIFY_RECEIVED
  });
  callerListInfo[_data.account] = _data
  isRepeatability(callerList, _data.account) ? callerList.add(new Option(_data.account, _data.account)) : null
}

//对方拒绝
function callRejected(_data){
  console.log("===== 收到 callRejected 事件: ", _data)
  addLog(_data.account + ' 挂断了你的呼叫')
  currentData.isCalling = false
}

//对方应答
function callAccepted(_data){
  console.log("===== 收到 callAccepted 事件: ", _data)
  addLog(_data.account + " 接受了你的呼叫")
  currentData.onThePhone = true
  currentData.isCalling = false
  currentData.remoteAccount = _data.account

  netcall.startRtc(_data)
    .then(function(data) {
      console.log("连接媒体网关成功: ", data)
      openTheMicro()
      openTheCamera()
    })
    .catch(function(error) {
      console.log('连接媒体网关失败: ', error)
      addLog('连接媒体网关失败')
      cleanSession(_data.account)
    })
}

//对方挂断
function hangup(_data){
  console.log("===== 收到 hangup 事件: ", _data)
  addLog(_data.account + '挂断了对你的呼叫')
  isRepeatability(callerList, _data.account) ? null : callerList.remove(_data.account)
  if(currentData.remoteAccount == _data.account) {
    currentData.onThePhone = false
  } else if(currentData.localAccount == _data.account) {
    currentData.onThePhone = currentData.isCalling = false
  } else {
    console.log("忽略，收到 %s 的挂断通知", _data.account)
  }
}

function cleanSession(account){
  delete callerListInfo[account]
  callerList.remove(account)
  netcall.hangup()
  currentData.onThePhone = currentData.isCalling = false
}

/** 
 * ----------------------------------------
 *              开关媒体设备
 * ----------------------------------------
 */

// 收到对方的媒体流更新通知，需要重新播放对端媒体
function remoteTrack(_data){
  console.log('===== 收到remoteTrack事件: ', _data);
  if (_data && _data.track && _data.track.kind == 'audio') {
    console.log('开始播放 %s 声音', _data.account)
    netcall.startDevice({
      type: WebRTC.DEVICE_TYPE_AUDIO_OUT_CHAT
    }).then(obj => {
      console.log('成功播放 %s 声音', _data.account)
      addLog('播放 ' + _data.account + ' 声音成功')
    }).catch(err => {
      console.log('成功播放 %s 声音 %o', _data.account, err)
      addLog('播放 ' + _data.account + ' 声音失败')
    })
  } else if(_data && _data.track && _data.track.kind == 'video') {
    console.log('开始播放 %s 画面', _data.account)
    addLog('播放 ' + _data.account + ' 画面成功')
    previewRemoteVideo(_data.account)
  }
}

//预览本地视频画面
function previewLocalVideo(){
  netcall.startLocalStream($("#local-container").get(0))
  netcall.setVideoViewSize({
    width: eval($('#localWidth').val()) || 150,
    height: eval($('#localHeights').val()) || 120,
    cut: $('#localCrop').prop('checked')
  })
}

//预览远端视频画面
function previewRemoteVideo(account){
  //收到远程流事件后进行渲染远程节点
  netcall.startRemoteStream({
    account: account,
    node: $("#remote-container").get(0)
  })
  // 重新设置尺寸
  netcall.setVideoViewRemoteSize({
    account: account,
    width: eval($('#remoteWidth').val()) || 120,
    height: eval($('#remoteHeights').val()) || 120,
    cut: $('#remoteCrop').prop('checked')
  })
}

function openTheMicro(){
  netcall.startDevice({
    type: WebRTC.DEVICE_TYPE_AUDIO_IN,
    enableEchoCancellation: $("#AEC-enable").prop('checked'),
    device: {
      deviceId: $('#micro').val()
    }
  })
  .then(function(res) {
    console.log('开启 mic 成功')
    addLog('开启 mic 成功')
    if(!$('#micro').val()){
      //Safari浏览器，需要调用一次startDevice，才能获取设备列表
      syncDeviceList()
    }
  })
  .catch(function(error) {
    addLog('开启 mic 失败')
    console.log('开启mic成功: ', error);
  })
}

function closeTheMicro(){
  netcall.stopDevice(WebRTC.DEVICE_TYPE_AUDIO_IN)
    .then(function(data) {
      console.log('关闭 mic 成功')
      addLog("关闭 mic 成功")
    })
    .catch(function(error) {
      console.log('关闭 mic 出错: ', error)
      addLog("关闭 mic 出错")
    })
}

function openTheCamera(){
  netcall.startDevice({
    type: WebRTC.DEVICE_TYPE_VIDEO,
    device: {
      deviceId: $('#camera').val()
    }
  })
  .then(function(res) {
    console.log('开启 camera 成功')
    addLog('开启 camera 成功')
    previewLocalVideo()
    if(!$('#camera').val()){
      syncDeviceList()
    }
  })
  .catch(function(error) {
    addLog('开启设备出错')
    console.log(error);
  })
}

function closeTheCamera(){
  netcall.stopDevice(WebRTC.DEVICE_TYPE_VIDEO)
    .then(function(data) {
      console.log('关闭 camera 成功')
      addLog("关闭 camera 成功")
    })
    .catch(function(error) {
      console.log('关闭 camera 出错: ', error)
      addLog("关闭 camera 出错")
    })
}

$("#playMicro").click(function(event) {
  openTheMicro()
})
$("#playMicroOff").click(function(event) {
  closeTheMicro()
})
$("#playCamera").click(function(event) {
  openTheCamera()
})
$("#playCameraOff").click(function(event) {
  closeTheCamera()
})

/** 
 * ----------------------------------------
 *              音视频播放控制
 * ----------------------------------------
 */
$('#setLocal').click(function(event) {
  if(!$('#localWidth').val() || !$('#localHeight').val()) {
    alert('请输入视频宽高')
    return
  }
  console.log('设置自己的换面尺寸')
  addLog(`【设置自己画面尺寸】宽：${$('#localWidth').val()}高：${$('#localHeight').val()}`)
  netcall.setVideoViewSize({
    width: $('#localWidth').val(),
    height: $('#localHeight').val(),
    cut: $('#localCrop').prop('checked')
  })
})

$('#setRemote').click(function(event) {
  if(!$('#remoteWidth').val() || !$('#remoteHeight').val()) {
    alert('请输入视频宽高')
    return
  }
  console.log('设置对方的换面尺寸')
  addLog(`【设置对方画面尺寸】宽：${$('#remoteWidth').val()}高：${$('#remoteHeight').val()}`)
  netcall.setVideoViewRemoteSize({
    account: currentData.remoteAccount,
    width: $('#remoteWidth').val(),
    height: $('#remoteHeight').val(),
    cut: $('#remoteCrop').prop('checked')
  })
})

$('#playSelfAudio').click(function(event) {
  const account = $("#controlLocal").prop('checked') ? -1 : currentData.remoteAccount
  addLog('播放 ' + account + ' 声音开始')
  netcall.setAudioStart(account)
})

$('#playSelfAudioOff').click(function(event) {
  const account = $("#controlLocal").prop('checked') ? -1 : currentData.remoteAccount
  addLog('关闭 ' + account + ' 声音开始')
  netcall.setAudioBlack(account)
})

$('#setLocalView').click(function(event) {
  if($("#controlLocal").prop('checked'))
    previewLocalVideo()
  else
    previewRemoteVideo(currentData.remoteAccount)
})

$('#setLocalViewOff').click(function(event) {
  if($("#controlLocal").prop('checked'))
    netcall.stopLocalStream()
  else
    netcall.stopRemoteStream(currentData.remoteAccount)
})

$('#playSelfVideo').click(function(event) {
  if($("#controlLocal").prop('checked'))
    netcall.resumeLocalStream()
  else
    netcall.resumeRemoteStream(currentData.remoteAccount)
})

$('#pauseSelfVideo').click(function(event) {
  if($("#controlLocal").prop('checked'))
    netcall.suspendLocalStream()
  else
    netcall.suspendRemoteStream(currentData.remoteAccount)
})

$('#volumeInput').blur(function(event) {
  let volume = Number(event.target.value.trim())
  if(volume < 0 || volume > 255) {
    alert('请输入0-255之间的数据')
    return
  }
  console.log('volume: ', volume)
  if($("#controlLocal").prop('checked'))
    netcall.setPlayVolume(volume, currentData.localAccount)
  else
    netcall.setPlayVolume(volume, currentData.remoteAccount)
  
})

/** 
 * ----------------------------------------
 *              处理设备列表
 * ----------------------------------------
 */

//加载音视频设备列表

function syncDeviceList(){
  //获取音频设备
  netcall.getDevicesOfType(WebRTC.DEVICE_TYPE_AUDIO_IN).then(function(
    data
  ) {
    console.log("麦克风: %o", data);
    $('#micro').html(renderDeivce(data))
  })

  //获取视频设备
  netcall.getDevicesOfType(WebRTC.DEVICE_TYPE_VIDEO).then(function(
    data
  ) {
    console.log("摄像头: ", data);
    $('#camera').html(renderDeivce(data))
  });
}


function renderDeivce(device) {
  var html = ""
  for (var i = 0, len = device.length; i < len; i++) {
    html +=
      '<option value="' +
      device[i].deviceId +
      '">' +
      device[i].label +
      "</option>"
  }
  return html
}

/** 
 * ----------------------------------------
 *              工具类函数
 * ----------------------------------------
 */

function isRepeatability(listNode, item) {
  for(i = 0,len = listNode.options.length; i < len; i++) {
    console.warn(listNode.options[i].value)
    if(listNode.options[i].value === item) {
      return false
    }
  }
  return true
}

