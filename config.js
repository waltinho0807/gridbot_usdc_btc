module.exports = {
    API_KEY: '',
    SECRET_KEY: '',
    SYMBOL: 'BTC/USDC',
    GRID_SIZE: 300, // distância entre as ordens
    POSITION_SIZE: 10, // quantidade de BTC por ordem
    NUM_BUY_GRID_LINES: 3,
    NUM_SELL_GRID_LINES: 3,
    CLOSED_ORDER_STATUS: 'closed',
    CHECK_ORDERS_FREQUENCY: 10000, // em ms
    MAX_EXPOSURE: 0.005, // exposição máxima em BTC
    STOP_LOSS_PRICE: 90000 // opcional, preço mínimo para encerrar tudo
};
