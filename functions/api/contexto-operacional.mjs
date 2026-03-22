const BRAZIL_FIXED_HOLIDAYS_MM_DD = [
    '01-01', // Confraternização Universal
    '04-21', // Tiradentes
    '05-01', // Dia do Trabalhador
    '09-07', // Independência do Brasil
    '10-12', // Nossa Senhora Aparecida
    '11-02', // Finados
    '11-15', // Proclamação da República
    '11-20', // Dia Nacional de Zumbi e da Consciência Negra
    '12-25'  // Natal
];

const BRAZIL_VARIABLE_HOLIDAYS_YYYY_MM_DD = {
    2026: ['2026-02-16', '2026-02-17', '2026-04-03', '2026-06-04']
};

const MARKET_OPEN_HOUR_BR = 9;
const MARKET_CLOSE_HOUR_BR = 17;
const BRAZIL_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

function toBrazilUtcMinus3(dateUtc = new Date()) {
    return new Date(dateUtc.getTime() - BRAZIL_UTC_OFFSET_MS);
}

function isBrazilHolidayByDate(brDate) {
    const ano = brDate.getUTCFullYear();
    const mes = String(brDate.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(brDate.getUTCDate()).padStart(2, '0');
    const dataBrasilISO = `${ano}-${mes}-${dia}`;
    const mesDia = `${mes}-${dia}`;

    const feriadoFixo = BRAZIL_FIXED_HOLIDAYS_MM_DD.includes(mesDia);
    const feriadosVariaveisAno = BRAZIL_VARIABLE_HOLIDAYS_YYYY_MM_DD[ano] || [];
    const feriadoVariavel = feriadosVariaveisAno.includes(dataBrasilISO);

    return feriadoFixo || feriadoVariavel;
}

export function getOperationalContext(nowUtc = new Date()) {
    const brTime = toBrazilUtcMinus3(nowUtc);
    const hora = brTime.getUTCHours();
    const minuto = String(brTime.getUTCMinutes()).padStart(2, '0');
    const diaSemana = brTime.getUTCDay();
    const ano = brTime.getUTCFullYear();
    const mes = String(brTime.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(brTime.getUTCDate()).padStart(2, '0');
    const dataBrasilISO = `${ano}-${mes}-${dia}`;
    const is_feriado = isBrazilHolidayByDate(brTime);
    const is_fim_semana = diaSemana === 0 || diaSemana === 6;
    const is_plantao = is_fim_semana || is_feriado || hora < MARKET_OPEN_HOUR_BR || hora >= MARKET_CLOSE_HOUR_BR;

    return {
        hora,
        minuto,
        diaSemana,
        dataBrasilISO,
        is_feriado,
        is_plantao
    };
}

export function isBrazilHoliday(dateUtc = new Date()) {
    return isBrazilHolidayByDate(toBrazilUtcMinus3(dateUtc));
}
