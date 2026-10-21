/* Lógica de domínio sem dependências Google; exercitada por tests/booking.test.cjs. */
var BookingCore = (function () {
  'use strict';
  var SERVICES = { noivas: 'Noivas', debutantes: 'Debutantes', social: 'Maquiagem social', curso: 'Automaquiagem presencial' };
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  function failure(message) { var error = new Error(message); error.isPublic = true; return error; }
  function text(value, label, max, required) {
    var result = String(value == null ? '' : value).trim();
    if ((required && !result) || result.length > max || /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(result)) {
      throw failure('Revise o campo ' + label + '.');
    }
    return result;
  }
  function localDate(date, time, deps) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      throw failure('Informe uma data e um horário válidos.');
    }
    var start;
    try { start = deps.parseLocal(date, time); } catch (_) { throw failure('Informe uma data válida.'); }
    if (!start || isNaN(start.getTime()) || deps.formatLocal(start) !== date + ' ' + time) {
      throw failure('Informe uma data válida.');
    }
    return start;
  }
  function futureDate(date, time, deps) {
    var start = localDate(date, time, deps), now = deps.now().getTime();
    if (start.getTime() < now + 60 * 60 * 1000) throw failure('Escolha um horário com pelo menos uma hora de antecedência.');
    if (start.getTime() > now + 730 * 24 * 60 * 60 * 1000) throw failure('Escolha uma data nos próximos dois anos.');
    return start;
  }
  function validate(input, deps, skipFuture) {
    if (String(input.website || '').trim()) throw failure('Não foi possível enviar. Fale conosco pelo WhatsApp.');
    if (!UUID.test(String(input.requestId || ''))) throw failure('Atualize a página e tente novamente.');
    var name = text(input.name, 'nome', 100, true);
    if (name.length < 2 || /[\r\n\t]/.test(name)) throw failure('Informe seu nome completo.');
    var rawPhone = text(input.phone, 'WhatsApp', 30, true);
    if (!/^[+\d\s().-]+$/.test(rawPhone)) throw failure('Informe um WhatsApp brasileiro com DDD.');
    var phone = rawPhone.replace(/\D/g, '');
    if (phone.length === 10 || phone.length === 11) phone = '55' + phone;
    if (!/^55[1-9]\d\d{8,9}$/.test(phone)) throw failure('Informe um WhatsApp brasileiro com DDD.');
    if (!Object.prototype.hasOwnProperty.call(SERVICES, input.service)) throw failure('Selecione uma experiência.');
    var date = text(input.date, 'data', 10, true), time = text(input.time, 'horário', 5, true);
    if (skipFuture) localDate(date, time, deps); else futureDate(date, time, deps);
    if (input.consent !== true && input.consent !== 'true' && input.consent !== 'on') {
      throw failure('Autorize o uso dos dados para responder à sua solicitação.');
    }
    return { requestId: input.requestId.toLowerCase(), name: name, phone: '+' + phone, service: input.service,
      date: date, time: time, notes: text(input.notes, 'observações', 1000, false) };
  }
  function authorize(deps) {
    var expected = String(deps.adminEmail || '').trim().toLowerCase();
    var active = String(deps.activeEmail() || '').trim().toLowerCase();
    // Nunca substituir getActiveUser por getEffectiveUser: no endpoint público seria o proprietário.
    if (!expected || !active || active !== expected) throw failure('Acesso restrito. Abra a implantação privada com a conta autorizada.');
    return active;
  }
  function sheetSafe(value) {
    var result = String(value == null ? '' : value);
    return /^[\s]*[=+\-@]/.test(result) ? '\u200b' + result : result;
  }
  function sheetRead(value) { return String(value == null ? '' : value).replace(/^\u200b(?=[\s]*[=+\-@])/, ''); }

  function create(deps) {
    function request(input) {
      var data = validate(input, deps, true);
      var fingerprint = deps.hash(JSON.stringify([data.name, data.phone, data.service, data.date, data.time, data.notes]));
      return deps.withLock(function () {
        var previous = deps.store.findByRequestId(data.requestId);
        if (previous) {
          if (previous.payloadHash !== fingerprint) throw failure('Este envio já foi usado. Atualize a página para fazer outra solicitação.');
          return { reference: previous.reference };
        }
        futureDate(data.date, data.time, deps);
        var today = deps.formatLocal(deps.now()).slice(0, 10);
        if (deps.store.countCreatedOn(today) >= deps.dailyLimit) throw failure('O formulário está indisponível no momento. Fale conosco pelo WhatsApp.');
        var timestamp = deps.now().toISOString();
        var record = Object.assign({}, data, { reference: 'LL-' + deps.uuid().replace(/-/g, '').slice(0, 12).toUpperCase(),
          createdAt: timestamp, updatedAt: timestamp, status: 'PENDING', consentAt: timestamp, payloadHash: fingerprint,
          confirmedDate: '', confirmedTime: '', durationMinutes: '', eventId: '', adminNote: '', decidedBy: '' });
        deps.store.append(record);
        return { reference: record.reference };
      });
    }
    function list() {
      authorize(deps);
      return deps.store.list().map(function (row) {
        var output = Object.assign({}, row);
        delete output.payloadHash; delete output.consentAt; delete output._row;
        return output;
      }).sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
    }
    function approve(input) {
      var actor = authorize(deps);
      if (!UUID.test(String(input.requestId || ''))) throw failure('Solicitação inválida.');
      return deps.withLock(function () {
        var record = deps.store.findByRequestId(input.requestId.toLowerCase());
        if (!record) throw failure('Solicitação não encontrada.');
        if (record.status === 'APPROVED') return { reference: record.reference, status: record.status, eventId: record.eventId };
        if (record.status !== 'PENDING') throw failure('Esta solicitação já foi encerrada.');
        var date = text(input.date || record.date, 'data', 10, true);
        var time = text(input.time || record.time, 'horário', 5, true);
        var start = localDate(date, time, deps);
        var duration = Number(input.durationMinutes);
        if (!Number.isInteger(duration) || duration < 30 || duration > 720 || duration % 15 !== 0) {
          throw failure('Informe uma duração de 30 a 720 minutos, em intervalos de 15.');
        }
        var note = text(input.adminNote, 'observação interna', 1000, false);
        var end = new Date(start.getTime() + duration * 60000);
        var marker = '[livia-request:' + record.requestId + ']';
        // Recupera evento criado antes de uma eventual falha de escrita na planilha.
        // A busca usa o dia solicitado e o dia confirmado salvo antes da criação.
        var recoveryStart = record.confirmedDate ? localDate(record.confirmedDate, record.confirmedTime, deps) : start;
        var recoveryEnd = new Date(recoveryStart.getTime() + Math.max(Number(record.durationMinutes) || duration, 30) * 60000);
        var existing = deps.calendar.findByMarker(recoveryStart, recoveryEnd, marker);
        var event;
        if (existing) {
          event = existing;
          date = deps.formatLocal(event.start).slice(0, 10);
          time = deps.formatLocal(event.start).slice(11, 16);
          duration = Math.round((event.end.getTime() - event.start.getTime()) / 60000);
        } else {
          futureDate(date, time, deps);
          if (deps.calendar.busy(start, end)) throw failure('Há outro compromisso nesse intervalo. Escolha outro horário antes de aprovar.');
          // Checkpoint antes de Calendar: permite recuperar um evento mesmo que o próximo update falhe.
          record.confirmedDate = date; record.confirmedTime = time; record.durationMinutes = String(duration);
          deps.store.update(record);
          event = deps.calendar.create(SERVICES[record.service] + ' · ' + record.name, start, end,
            'Agendamento aprovado por Lívia Lopes.\nReferência: ' + record.reference + '\nWhatsApp: ' + record.phone +
            '\nObservações da cliente: ' + record.notes + '\n' + marker);
        }
        record.status = 'APPROVED'; record.eventId = event.id;
        record.confirmedDate = date; record.confirmedTime = time; record.durationMinutes = String(duration);
        record.updatedAt = deps.now().toISOString(); record.adminNote = note; record.decidedBy = actor;
        deps.store.update(record);
        return { reference: record.reference, status: record.status, eventId: record.eventId };
      });
    }
    function decline(input) {
      var actor = authorize(deps);
      if (!UUID.test(String(input.requestId || ''))) throw failure('Solicitação inválida.');
      return deps.withLock(function () {
        var record = deps.store.findByRequestId(input.requestId.toLowerCase());
        if (!record) throw failure('Solicitação não encontrada.');
        if (record.status === 'DECLINED') return { reference: record.reference, status: record.status };
        if (record.status !== 'PENDING') throw failure('Esta solicitação já foi encerrada. Gerencie eventos aprovados no Google Agenda.');
        // Uma tentativa anterior pode ter criado o evento e falhado ao salvar APPROVED.
        if (record.confirmedDate) {
          var start = localDate(record.confirmedDate, record.confirmedTime, deps);
          var event = deps.calendar.findByMarker(start, new Date(start.getTime() + Number(record.durationMinutes) * 60000), '[livia-request:' + record.requestId + ']');
          if (event) throw failure('Já existe um evento criado. Clique em aprovar para recuperar a confirmação antes de gerenciá-lo no Agenda.');
        }
        record.status = 'DECLINED'; record.updatedAt = deps.now().toISOString(); record.decidedBy = actor;
        record.adminNote = text(input.adminNote, 'observação interna', 1000, false);
        deps.store.update(record);
        return { reference: record.reference, status: record.status };
      });
    }
    return { request: request, list: list, approve: approve, decline: decline };
  }
  return { create: create, validate: validate, sheetSafe: sheetSafe, sheetRead: sheetRead, failure: failure, services: SERVICES };
}());
