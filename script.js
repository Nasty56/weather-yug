const citySelect = document.getElementById("city-select");
const tempElement = document.getElementById("temperature");
const descElement = document.getElementById("weather-desc");
const pressureElement = document.getElementById("dav");
const iconElement = document.getElementById("weather-icon");
const hourlyTimes = document.querySelectorAll(".time");
const hourlyTemps = document.querySelectorAll(".gr");
const hourlyIcons = document.querySelectorAll(".icon_img");
const weeklyData = document.querySelectorAll(".d");
const weeklyTemp = document.querySelectorAll(".t");
const weeklyIcons = document.querySelectorAll(".pog");
const menuBtn = document.querySelector(".menu-btn");
const menuNav = document.getElementById("menu-nav");
const menuClose = document.getElementById("menu-close");
const menuOverlay = document.getElementById("menu-overlay");

const cities = {
  Prim: { name: "Приморско-Ахтарск", lat: 46.0435, lon: 38.1776 },
  Kras: { name: "Краснодар", lat: 45.0355, lon: 38.9753 },
  Eysk: { name: "Ейск", lat: 46.7119, lon: 38.2727 },
  Sochi: { name: "Сочи", lat: 43.6, lon: 39.73 },
  Gel: { name: "Геленджик", lat: 44.5744, lon: 38.0805 },
  Slav: { name: "Славянск-на-Кубани", lat: 45.26, lon: 38.13 },
  Tim: { name: "Тимашевск", lat: 45.62, lon: 38.95 },
  Can: { name: "Каневская", lat: 46.09, lon: 38.96 },
  GorK: { name: "Горячий Ключ", lat: 44.6239, lon: 39.1454 },
};

const playlists = {
  spring: "https://music.yandex.ru/iframe/#playlist/NaatySoloveva/1008",
  summer: "https://music.yandex.ru/iframe/#playlist/NaatySoloveva/1007",
  cozy: "https://music.yandex.ru/iframe/#playlist/NaatySoloveva/1006",
};

function getWeatherInfo(code) {
  if (code === 0 || code === 1)
    return { desc: "Ясно", icon: "солнце.png", themes: "sunny" };
  if ((code >= 2 && code <= 3) || code === 45 || code === 48)
    return { desc: "Облачно", icon: "облачно.png", themes: "cloud" };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return { desc: "Дождь", icon: "дождь.png", themes: "rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { desc: "Снег", icon: "снег.png", themes: "snow" };
  if (code >= 95)
    return { desc: "Гроза", icon: "гроза.png", themes: "thunderstorm" };
  return { desc: "—", icon: "облачно.png", themes: "cloud" };
}

function getPlaylistKey(weatherCode, temp) {
  if (temp > 28) return "summer";
  if (temp < 24) return "cozy";
  if (weatherCode === 0 || weatherCode === 1) return "spring";
  return "cozy";
}

async function fetchWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,surface_pressure` +
    `&hourly=temperature_2m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=Europe/Moscow&forecast_days=7`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Ошибка API: " + response.status);
  return await response.json();
}

async function weatherChange(cityCode) {
  const city = cities[cityCode];
  if (!city) return;

  if (descElement) descElement.textContent = "Загрузка...";

  try {
    const data = await fetchWeather(city.lat, city.lon);
    const current = data.current;
    const temp = Math.round(current.temperature_2m);
    const code = current.weather_code;
    const pressure = Math.round(current.surface_pressure / 1.333);
    const info = getWeatherInfo(code);

    if (tempElement)
      tempElement.textContent = (temp > 0 ? "+" : "") + temp + "°";
    if (descElement) descElement.textContent = info.desc;
    if (pressureElement) pressureElement.textContent = pressure + " мм рт. ст.";
    if (iconElement) iconElement.src = info.icon;

    if (info.themes) {
      document.body.className = "";
      document.body.classList.add(info.themes);
    }

    const playlistKey = getPlaylistKey(code, temp);
    const playlistUrl = playlists[playlistKey];
    const container = document.getElementById("playlist-container");
    if (container && playlistUrl) {
      container.innerHTML = `
        <iframe frameborder="0" allow="clipboard-write"
          style="border:none;width:100%;height:400px;"
          src="${playlistUrl}"></iframe>`;
    }

    if (hourlyTimes.length > 0 && data.hourly) {
      const now = new Date(current.time);
      const hourly = data.hourly;
      let startIdx = 0;
      for (let i = 0; i < hourly.time.length; i++) {
        if (new Date(hourly.time[i]) >= now) {
          startIdx = i;
          break;
        }
      }

      for (let i = 0; i < hourlyTimes.length; i++) {
        const idx = startIdx + i;
        if (idx >= hourly.time.length) break;

        const hTemp = Math.round(hourly.temperature_2m[idx]);
        const hInfo = getWeatherInfo(hourly.weather_code[idx]);

        if (hourlyTimes[i])
          hourlyTimes[i].textContent = hourly.time[idx].slice(11, 16);
        if (hourlyTemps[i])
          hourlyTemps[i].textContent = (hTemp > 0 ? "+" : "") + hTemp;
        if (hourlyIcons[i]) hourlyIcons[i].src = hInfo.icon;
      }
    }

    if (weeklyData.length > 0 && data.daily) {
      const daily = data.daily;
      for (let i = 0; i < weeklyData.length; i++) {
        if (i >= daily.time.length) break;

        const parts = daily.time[i].split("-");
        const dTemp = Math.round(daily.temperature_2m_max[i]);
        const dInfo = getWeatherInfo(daily.weather_code[i]);

        if (weeklyData[i])
          weeklyData[i].textContent = `${parts[2]}.${parts[1]}`;
        if (weeklyTemp[i])
          weeklyTemp[i].textContent = (dTemp > 0 ? "+" : "") + dTemp;
        if (weeklyIcons[i]) weeklyIcons[i].src = dInfo.icon;
      }
    }
  } catch (err) {
    console.error("Ошибка загрузки:", err);
    if (descElement) descElement.textContent = "Ошибка загрузки";
  }
}

if (citySelect) {
  const savedCity = localStorage.getItem("selectedCity");
  if (savedCity && cities[savedCity]) {
    citySelect.value = savedCity;
  }

  citySelect.addEventListener("change", (event) => {
    const city = event.target.value;
    localStorage.setItem("selectedCity", city);
    weatherChange(city);
  });

  weatherChange(citySelect.value);
} else {
  const savedCity = localStorage.getItem("selectedCity") || "Prim";
  weatherChange(savedCity);
}

function openMenu() {
  if (menuNav) menuNav.classList.add("open");
  if (menuOverlay) menuOverlay.classList.add("open");
}

function closeMenu() {
  if (menuNav) menuNav.classList.remove("open");
  if (menuOverlay) menuOverlay.classList.remove("open");
}

if (menuBtn && menuNav) {
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menuNav.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (menuClose) menuClose.addEventListener("click", closeMenu);
  if (menuOverlay) menuOverlay.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  menuNav.querySelectorAll("a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
}
