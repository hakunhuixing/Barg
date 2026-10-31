
const API_BASE = 'https://clearance-sun-until-nine.trycloudflare.com';
const TOKEN_KEY = 'm2_user_token';



function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('m2_user_info');
}



async function request(path, options = {}) {
  const method = options.method || 'GET';
  const body = options.body;
  const query = options.query;
  const auth = options.auth !== false; 

  let url = API_BASE + path;

  if (query) {
    const params = new URLSearchParams();
    for (const key in query) {
      const value = query[key];
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    }
    const queryString = params.toString();
    if (queryString) {
      url = url + '?' + queryString;
    }
  }


  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
  }


  const fetchOptions = { method: method, headers: headers };

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }


  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err) {

    throw { code: -1, message: '网络异常，请确认后端已启动且允许跨域' };
  }


  let result;
  try {
    result = await response.json();
  } catch (err) {
    throw { code: -1, message: '服务异常（HTTP ' + response.status + '）' };
  }


  if (result.code === 0) {
    return result.data;
  }

  if (result.code === 1002) {
    clearToken();
    const current = location.pathname.split('/').pop() + location.search;
    location.href = 'login.html?redirect=' + encodeURIComponent(current);
    throw result;
  }

  if (result.code === 2003) {
    clearToken();
    alert('账号已被封禁');
    location.href = 'login.html';
    throw result;
  }

  throw result;
}

const ERROR_MESSAGES = {
  1001: '参数错误',
  1002: '未登录或登录已过期',
  1003: '无权限',
  1004: '资源不存在',
  1005: '操作过于频繁，请稍后重试',
  2001: '用户名已存在',
  2002: '用户名或密码错误',
  2003: '账号已被封禁',
  3001: '邀请码无效',
  3002: '邀请码已用完',
  3003: '邀请码已过期',
  3004: '邀请码已停用'
};

function messageOf(code, fallback) {
  return ERROR_MESSAGES[code] || fallback || '操作失败';
}


function showFieldErrors(errors, formEl) {
  if (!errors) return;
  const list = Array.isArray(errors) ? errors : Object.values(errors);

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const field = String(item.field || '').split('.').pop(); // body.username -> username
    const input = formEl.querySelector('[name="' + field + '"]');
    if (input) {
      const errEl = input.parentElement.querySelector('.error');
      if (errEl) errEl.textContent = item.message || '参数错误';
    }
  }
}