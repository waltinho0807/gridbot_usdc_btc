module.exports = {
    API_KEY: 'u5GNi8ViyY58FVTE3Idklnl859LCrImnuYUrsjwYx0NTjuFLG4Hbe9VXvhFaW9Bv',
    SECRET_KEY: 'yOvODvjhK75fiiuN0x7sMhicWzVNNg1UV7UixeeR2RVUrGDeUGfQ1amwwrD2xg4b',
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
