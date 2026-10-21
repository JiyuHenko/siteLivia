/* Configuração e adaptadores Google. Todas as funções auxiliares terminam em _:
 * não podem ser chamadas por google.script.run. Nunca exponha a planilha publicamente. */
var BOOKING_HEADERS_ = ['requestId', 'reference', 'createdAt', 'updatedAt', 'status', 'name', 'phone', 'service', 'date', 'time', 'notes', 'consentAt', 'payloadHash', 'confirmedDate', 'confirmedTime', 'durationMinutes', 'eventId', 'adminNote', 'decidedBy'];
var BOOKING_ZONE_ = 'America/Sao_Paulo';

function doGet(e) {
  if (e && e.parameter && e.parameter.view === 'admin') {
    try {
      assertAdmin_();
      return HtmlService.createHtmlOutputFromFile('Admin').setTitle('Agenda · Lívia Lopes');
    } catch (_) { return HtmlService.createHtmlOutput('<p>Acesso restrito. Entre com a conta autorizada na implantação privada.</p>'); }
  }
  return HtmlService.createHtmlOutput('<p>Pré-agendamento Lívia Lopes. Envie sua solicitação pelo site oficial.</p>');
}

function doPost(e) {
  var requestId = '', response, origin;
  try {
    var config = config_(); origin = config.siteOrigin;
    if (!e || !e.parameter || Number(e.contentLength) > 12000) throw BookingCore.failure('Solicitação inválida.');
    var input = e.parameter;
    requestId = /^[0-9a-f-]{36}$/i.test(String(input.requestId || '')) ? input.requestId : '';
    if (input.action !== 'request') throw BookingCore.failure('Solicitação inválida.');
    // Evita campos duplicados / interpretações divergentes entre formulário e servidor.
    Object.keys(e.parameters || {}).forEach(function (key) {
      if (e.parameters[key].length !== 1) throw BookingCore.failure('Solicitação inválida.');
    });
    var result = service_(config).request(input);
    response = { source: 'livia-booking', requestId: requestId, ok: true, reference: result.reference, error: '' };
  } catch (error) {
    response = { source: 'livia-booking', requestId: requestId, ok: false, reference: '',
      error: error.isPublic ? error.message : 'Não foi possível registrar agora. Tente novamente ou fale pelo WhatsApp.' };
    if (!error.isPublic) console.error('Booking intake failure; consulte configuração, permissões e disponibilidade dos serviços.');
  }
  if (!origin) return HtmlService.createHtmlOutput('<p>Formulário indisponível. Entre em contato pelo WhatsApp.</p>');
  // HtmlService insere uma camada de iframe. top alcança o site externo;
  // parent cobre a execução sem essa camada. O destino é uma origem exata configurada.
  var payload = safeJson_(response), target = safeJson_(origin);
  var html = '<!doctype html><meta charset="utf-8"><p>Solicitação processada. Volte ao site.</p><script>' +
    '(function(){var data=' + payload + ',origin=' + target + ';window.parent.postMessage(data,origin);' +
    'if(window.top!==window.parent)window.top.postMessage(data,origin);})();<\/script>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function adminListRequests() { assertAdmin_(); return service_(config_()).list(); }
function adminApproveRequest(input) { assertAdmin_(); return service_(config_()).approve(input || {}); }
function adminDeclineRequest(input) { assertAdmin_(); return service_(config_()).decline(input || {}); }

function config_() {
  var props = PropertiesService.getScriptProperties();
  var config = { spreadsheetId: props.getProperty('SPREADSHEET_ID'), calendarId: props.getProperty('CALENDAR_ID'),
    adminEmail: String(props.getProperty('ADMIN_EMAIL') || '').trim().toLowerCase(),
    siteOrigin: String(props.getProperty('SITE_ORIGIN') || '').trim(),
    dailyLimit: Number(props.getProperty('DAILY_REQUEST_LIMIT') || 100) };
  // SITE_ORIGIN nunca vem de dados enviados pela cliente.
  if (!config.spreadsheetId || !config.calendarId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.adminEmail) ||
      !/^(https:\/\/[a-z0-9.-]+(?::\d+)?|http:\/\/localhost(?::\d+)?)$/i.test(config.siteOrigin) ||
      !Number.isInteger(config.dailyLimit) || config.dailyLimit < 1 || config.dailyLimit > 1000) {
    throw new Error('Configuração ausente ou inválida.');
  }
  if (Session.getScriptTimeZone() !== BOOKING_ZONE_) throw new Error('Defina America/Sao_Paulo no projeto.');
  return config;
}
function assertAdmin_() {
  var expected = String(PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || '').trim().toLowerCase();
  var active = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!expected || !active || active !== expected) throw BookingCore.failure('Acesso restrito à conta autorizada.');
}
function safeJson_(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
function sheet_(config) {
  var document = SpreadsheetApp.openById(config.spreadsheetId);
  var sheet = document.getSheetByName('Solicitacoes');
  if (!sheet) throw new Error('Execute prepararPlanilha_ no editor primeiro.');
  var headers = sheet.getRange(1, 1, 1, BOOKING_HEADERS_.length).getDisplayValues()[0];
  if (headers.join('|') !== BOOKING_HEADERS_.join('|')) throw new Error('Colunas da planilha incompatíveis.');
  return sheet;
}
function store_(sheet) {
  function rows() {
    if (sheet.getLastRow() < 2) return [];
    return sheet.getRange(2, 1, sheet.getLastRow() - 1, BOOKING_HEADERS_.length).getDisplayValues().map(function (values, index) {
      var row = { _row: index + 2 };
      BOOKING_HEADERS_.forEach(function (key, col) { row[key] = BookingCore.sheetRead(values[col]); });
      return row;
    });
  }
  function values(record) { return BOOKING_HEADERS_.map(function (key) { return BookingCore.sheetSafe(record[key]); }); }
  return {
    list: rows,
    findByRequestId: function (id) { return rows().find(function (row) { return row.requestId === id; }); },
    countCreatedOn: function (day) { return rows().filter(function (row) {
      return Utilities.formatDate(new Date(row.createdAt), BOOKING_ZONE_, 'yyyy-MM-dd') === day;
    }).length; },
    append: function (record) {
      var range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, BOOKING_HEADERS_.length);
      range.setNumberFormat('@'); range.setValues([values(record)]); SpreadsheetApp.flush();
    },
    update: function (record) {
      if (!record._row || record._row < 2) throw new Error('Linha inválida.');
      var range = sheet.getRange(record._row, 1, 1, BOOKING_HEADERS_.length);
      range.setNumberFormat('@'); range.setValues([values(record)]); SpreadsheetApp.flush();
    }
  };
}
function calendar_(config) {
  var calendar = CalendarApp.getCalendarById(config.calendarId);
  if (!calendar) throw new Error('Agenda não encontrada ou sem permissão.');
  if (calendar.getTimeZone() !== BOOKING_ZONE_) throw new Error('Defina America/Sao_Paulo na agenda.');
  function model(event) { return { id: event.getId(), start: event.getStartTime(), end: event.getEndTime() }; }
  return {
    findByMarker: function (start, end, marker) {
      var matches = calendar.getEvents(start, end).filter(function (event) { return event.getDescription().indexOf(marker) !== -1; });
      if (matches.length > 1) throw BookingCore.failure('Há eventos duplicados para esta solicitação. Revise o Google Agenda antes de continuar.');
      return matches.length ? model(matches[0]) : null;
    },
    busy: function (start, end) { return calendar.getEvents(start, end).some(function (event) {
      return event.getStartTime().getTime() < end.getTime() && event.getEndTime().getTime() > start.getTime();
    }); },
    create: function (title, start, end, description) {
      return model(calendar.createEvent(title, start, end, { description: description, sendInvites: false }));
    }
  };
}
function service_(config) {
  return BookingCore.create({
    adminEmail: config.adminEmail, activeEmail: function () { return Session.getActiveUser().getEmail(); },
    dailyLimit: config.dailyLimit, store: store_(sheet_(config)),
    // Intake público não precisa consultar Calendar: o adaptador só é criado na aprovação.
    calendar: {
      findByMarker: function (a, b, c) { return calendar_(config).findByMarker(a, b, c); },
      busy: function (a, b) { return calendar_(config).busy(a, b); },
      create: function (a, b, c, d) { return calendar_(config).create(a, b, c, d); }
    },
    now: function () { return new Date(); }, uuid: function () { return Utilities.getUuid(); },
    hash: function (value) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8)); },
    parseLocal: function (date, time) { return Utilities.parseDate(date + ' ' + time, BOOKING_ZONE_, 'yyyy-MM-dd HH:mm'); },
    formatLocal: function (date) { return Utilities.formatDate(date, BOOKING_ZONE_, 'yyyy-MM-dd HH:mm'); },
    withLock: function (callback) {
      var lock = LockService.getScriptLock();
      if (!lock.tryLock(10000)) throw BookingCore.failure('Há outro envio em andamento. Aguarde alguns segundos e tente novamente.');
      try { return callback(); } finally { lock.releaseLock(); }
    }
  });
}

// Execute manualmente uma vez pelo editor, logada como administradora.
// O sufixo _ impede chamada via google.script.run.
function prepararPlanilha_() {
  assertAdmin_();
  var config = config_();
  var document = SpreadsheetApp.openById(config.spreadsheetId);
  document.setSpreadsheetTimeZone(BOOKING_ZONE_);
  var sheet = document.getSheetByName('Solicitacoes') || document.insertSheet('Solicitacoes');
  if (sheet.getLastRow() > 0) { sheet_(config); return; }
  sheet.getRange(1, 1, 1, BOOKING_HEADERS_.length).setValues([BOOKING_HEADERS_]).setFontWeight('bold');
  sheet.setFrozenRows(1);
}
