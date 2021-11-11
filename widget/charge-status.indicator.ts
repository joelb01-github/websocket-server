const clear = require('clear');
import * as chalk from 'chalk';

export class ChargeStatusIndicator {
  constructor() {}

  public update(status: string): void {
    clear();
    if (status === 'charging') {
      console.log(chalk.white.bgRed(formatMessage('Charging')));
    } else if (status === 'charging80') {
      console.log(chalk.black.bgYellow(formatMessage('Charging >80%')));
    } else if (status === 'charged') {
      console.log(chalk.black.bgGreen(formatMessage('Charged')));
    } else {
      console.log('Not recognized Status update', status);
    }
  }

  public getUpdateFn() {
    return this.update.bind(this);
  }
}

export function createChargeStatusIndicator(): ChargeStatusIndicator {
  return new ChargeStatusIndicator();
}

function formatMessage(message: string): string {
  return `         ${message}       
         ${message}       
         ${message}       `;
}
