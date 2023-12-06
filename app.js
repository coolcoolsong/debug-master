const puppeteer = require('puppeteer');
const axios = require('axios');

var token = process.env.CODETOKEN;
var index = 0;

var message = '';

const codes = {
    1000: '识别成功',
    10001: '参数错误',
    10002: '余额不足',
    10003: '无此访问权限',
    10004: '无此验证类型',
    10005: '网络拥塞',
    10006: '数据包过载',
    10007: '服务繁忙',
    10008: '网络错误，请稍后重试',
    10009: '结果准备中，请稍后再试',
    10010: '请求结束',
};

const type = '50100';
(async () => {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disabled-setupid-sandbox"], defaultViewport: null, executablePath: process.env.GOOGLE_CHROME_PATH });
    const page = await browser.newPage();
    page.on('response',
        function (response) {
            if (response.url().indexOf("captchaImage") != -1 && index == 0) {
                index++;
                response.text().then(async (body) => {
                    console.log("正在登录")
                    message += '<div>正在登录</div>';
                    let { img = "" } = JSON.parse(body);
                    img = 'data:image/png;base64,' + img;
                    let { data = {} } = await axios.post('http://api.jfbym.com/api/YmServer/customApi', { image: img, token, type });
                    let { data: value = -1, code = 0 } = data.data;
                    if (value == -1) {
                        let codestr = codes[code] ?? "不晓得是啥问题，去平台看看吧"
                        console.log(`验证码获取失败，平台的返回结果是：${code}-${codestr}`);
                        message += `<div>验证码获取失败，平台的返回结果是：${code}-${codestr}</div>`;
                        console.log("任务结束，正在退出")
                        await page.close();
                        browser.disconnect();
                        process.exit(0)
                    }
                    await page.click(".el-input__inner");
                    await page.type(".el-input__inner", process.env.USERNAME);
                    await page.type(".el-form-item:nth-child(3) .el-input__inner", process.env.PASSWORD);
                    console.log(`验证码获取成功，值为${value}`)
                    message += `<div>验证码获取成功，值为${value}</div>`;
                    await page.type(".el-form-item:nth-child(4) .el-input__inner", `${value}`);
                    await page.click(".el-form-item__content .login_submit");
                    await page.waitForNavigation();
                    message += `<div>登录成功</div>`;
                    await page.waitForSelector('.leftMenu_footer_userImg')
                    await page.hover('.leftMenu_footer_userImg');
                    await page.click('.icon-gerenzhongxin')
                    await page.waitForNavigation();
                    await page.waitForSelector('.el-badge')
                    await page.click(".el-badge button span");
                    await page.waitForSelector('.dialog-footer')
                    await page.click(".dialog-footer button span");
                    let url = `http://www.pushplus.plus/send?token=${process.env.PUSHTOKEN}&title=debug签到&content=${message}&template=html`;
                    await axios.get(url);
                    console.log("任务结束，正在退出")
                    await page.close();
                    browser.disconnect();
                    process.exit(0)
                })
            }

        });

    console.log("打开登录页面...");
    message += `<div>打开登录页面...</div>`;
    await page.goto('https://www.delbug.cn/login?redirect=%2Fuser%2FPersonal');
})();


