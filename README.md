# webrtcDemo

## 介绍 
webrtcDemo是 云信实时音webrtc能力在移动端使用的相关实例demo，使用[网易云信WEB端im SDK](http://dev.netease.im/docs/product/IM即时通讯/SDK开发集成/Web开发集成)，和[网易云信WEB端实时音 SDK](https://dev.yunxin.163.com/docs/product/%E9%9F%B3%E8%A7%86%E9%A2%91%E9%80%9A%E8%AF%9D/SDK%E5%BC%80%E5%8F%91%E9%9B%86%E6%88%90/Web%E5%BC%80%E5%8F%91%E9%9B%86%E6%88%90)

## 工程文件介绍

``` shell
  |- css 页面css文件，无需太多关注

  |- lib 使用的js库文件
    |- h5.js 该文件用户实现html页面上的所有功能

  |- nim 使用的云信sdk库
    |- NIM_Web_SDK_v6.8.0.js 云信im 6.8.0版本的sdk
    |- NIM_Web_WebRTC_v6.8.0.js 云信webrtc实时音 6.8.0版本的sdk

```

## 部署
- 执行 npm install http-server -g
- 执行 npm install
- 执行 npm run https-server
- 访问 https://127.0.0.1:8089/ 即可

## 使用
- 登录时请输入appkey、token用于认证（没有的请去[云信官网](https://yunxin.163.com/)申请）
- 登录的账号，是im 的账号请知悉
![demo示例](https://yx-web-nosdn.netease.im/quickhtml%2Fassets%2Fyunxin%2Fdefault%2FwebrtcDemoH5.jpg)
## 说明
- 该demo仅仅实现最简单的功能，sdk有很多其他强大的功能，请参考 [网易云信WEB端实时音 SDK](https://dev.yunxin.163.com/docs/product/%E9%9F%B3%E8%A7%86%E9%A2%91%E9%80%9A%E8%AF%9D/SDK%E5%BC%80%E5%8F%91%E9%9B%86%E6%88%90/Web%E5%BC%80%E5%8F%91%E9%9B%86%E6%88%90)
- Safari浏览器有限制音频播放的逻辑，可能会出现听不到对端声音的问题，需要使用者在该demo上点击打开 对方声音（该问题的具体说明，请参考[音频播放说明](https://dev.yunxin.163.com/docs/product/%E9%9F%B3%E8%A7%86%E9%A2%91%E9%80%9A%E8%AF%9D/SDK%E5%BC%80%E5%8F%91%E9%9B%86%E6%88%90/Web%E5%BC%80%E5%8F%91%E9%9B%86%E6%88%90/%E6%92%AD%E6%94%BE?#%E9%9F%B3%E9%A2%91%E6%92%AD%E6%94%BE%E8%AF%B4%E6%98%8E)
）
