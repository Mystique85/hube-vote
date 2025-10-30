// Kompleksowy system debugowania dla HUB Vote
class DebugLogger {
  private isEnabled = true;
  private module = 'HUB_VOTE';

  // Kolory dla konsoli
  private colors = {
    info: '#3498db',
    success: '#2ecc71', 
    warning: '#f39c12',
    error: '#e74c3c',
    contract: '#9b59b6',
    wallet: '#1abc9c',
    poll: '#e67e22',
    data: '#1abc9c'
  };

  constructor() {
    this.logSystemInfo();
  }

  private logSystemInfo() {
    if (!this.isEnabled) return;

    console.log(
      `%c🚀 ${this.module} Debug System Started` +
      `%c\n📅 ${new Date().toLocaleString()}` +
      `%c\n🌐 ${window.location.href}`,
      'color: #8e44ad; font-weight: bold; font-size: 14px;',
      'color: #7f8c8d;',
      'color: #7f8c8d;'
    );
  }

  // 1. DEBUG KONTRAKTU I BLOCKCHAIN
  contractDebug = {
    connection: (address: string, network: string) => {
      console.log(
        `%c📜 KONTRAKT: Połączono` +
        `%c\n📍 Adres: ${address}` +
        `%c\n🌐 Network: ${network}` +
        `%c\n🔗 Explorer: https://celoscan.io/address/${address}`,
        `color: ${this.colors.contract}; font-weight: bold;`,
        'color: #34495e;',
        'color: #34495e;',
        'color: #3498db; text-decoration: underline;'
      );
    },

    contractCall: (functionName: string, args: any[], txHash?: string) => {
      console.group(
        `%c🔄 WYWOŁANIE KONTRAKTU: ${functionName}`,
        `color: ${this.colors.contract}; font-weight: bold;`
      );
      console.log('📤 Argumenty:', args);
      if (txHash) {
        console.log(`📫 TX Hash: ${txHash}`);
        console.log(`🔍 Explorer: https://celoscan.io/tx/${txHash}`);
      }
      console.groupEnd();
    },

    contractError: (functionName: string, error: any, userAddress?: string) => {
      console.group(
        `%c❌ BŁĄD KONTRAKTU: ${functionName}`,
        `color: ${this.colors.error}; font-weight: bold;`
      );
      console.log('👤 Użytkownik:', userAddress || 'Niepołączony');
      console.log('💥 Błąd:', error);
      console.log('📝 Message:', error?.message);
      console.log('🔍 Code:', error?.code);
      console.log('📋 Data:', error?.data);
      
      // Analiza typowych błędów kontraktu
      if (error?.message?.includes('user rejected')) {
        console.log('🔍 DIAGNOSTYKA: Użytkownik odrzucił transakcję w portfelu');
      } else if (error?.message?.includes('insufficient funds')) {
        console.log('🔍 DIAGNOSTYKA: Brak funduszy na opłacenie gazu');
      } else if (error?.message?.includes('execution reverted')) {
        console.log('🔍 DIAGNOSTYKA: Kontrakt odrzucił wykonanie');
      }
      
      console.groupEnd();
    },

    pollCreation: (pollId: bigint, title: string, options: string[], creator: string) => {
      console.log(
        `%c🗳️ NOWA ANKIETA UTWORZONA` +
        `%c\n🆔 Poll ID: ${pollId.toString()}` +
        `%c\n📝 Tytuł: "${title}"` +
        `%c\n📊 Opcje: ${options.join(', ')}` +
        `%c\n👤 Twórca: ${creator}`,
        `color: ${this.colors.success}; font-weight: bold;`,
        'color: #34495e;',
        'color: #34495e;',
        'color: #34495e;',
        'color: #34495e;'
      );
    },

    voting: (pollId: bigint, optionIndex: bigint, voter: string, reward: bigint) => {
      console.log(
        `%c✅ GŁOS oddany` +
        `%c\n🗳️ Poll ID: ${pollId.toString()}` +
        `%c\n📋 Opcja: ${optionIndex.toString()}` +
        `%c\n👤 Głosujący: ${voter}` +
        `%c\n🎁 Nagroda: ${(Number(reward) / 1e18).toFixed(2)} VOTE`,
        `color: ${this.colors.success}; font-weight: bold;`,
        'color: #34495e;',
        'color: #34495e;',
        'color: #34495e;',
        'color: #2ecc71;'
      );
    }
  };

  // 2. DEBUG PORTFELA I AUTENTYKACJI
  walletDebug = {
    connection: (address: string, isConnected: boolean) => {
      console.log(
        `%c👛 PORTFEL: ${isConnected ? 'POŁĄCZONO' : 'ROZŁĄCZONO'}` +
        `%c\n📍 Adres: ${address || 'Brak'}`,
        `color: ${isConnected ? this.colors.success : this.colors.warning}; font-weight: bold;`,
        'color: #34495e;'
      );
    },

    balanceUpdate: (address: string, balance: bigint, token: string = 'VOTE') => {
      console.log(
        `%c💰 BALANS zaktualizowany` +
        `%c\n👤 Użytkownik: ${address}` +
        `%c\n💎 ${token}: ${(Number(balance) / 1e18).toFixed(2)}`,
        `color: ${this.colors.info}; font-weight: bold;`,
        'color: #34495e;',
        'color: #2ecc71; font-weight: bold;'
      );
    },

    transactionStatus: (txHash: string, status: 'pending' | 'success' | 'error', functionName: string) => {
      const statusColors = {
        pending: this.colors.warning,
        success: this.colors.success,
        error: this.colors.error
      };

      console.log(
        `%c${status === 'pending' ? '⏳' : status === 'success' ? '✅' : '❌'} TRANSACTION ${status.toUpperCase()}` +
        `%c\n📝 Funkcja: ${functionName}` +
        `%c\n📫 TX Hash: ${txHash}` +
        `%c\n🔍 Explorer: https://celoscan.io/tx/${txHash}`,
        `color: ${statusColors[status]}; font-weight: bold;`,
        'color: #34495e;',
        'color: #34495e;',
        'color: #3498db; text-decoration: underline;'
      );
    }
  };

  // 3. DEBUG ANKIET I GŁOSOWANIA - ZAKTUALIZOWANE
  pollDebug = {
    loadingPolls: (pollCount: bigint, loadedPolls: number) => {
      console.log(
        `%c📊 ŁADOWANIE ANKIET` +
        `%c\n📈 Łączna liczba: ${pollCount.toString()}` +
        `%c\n📥 Załadowano: ${loadedPolls}` +
        `%c\n⚠️ Status: ${loadedPolls === Number(pollCount) ? 'COMPLETE' : 'INCOMPLETE'}`,
        `color: ${this.colors.poll}; font-weight: bold;`,
        'color: #34495e;',
        loadedPolls === Number(pollCount) ? 'color: #2ecc71;' : 'color: #e74c3c;',
        loadedPolls === Number(pollCount) ? 'color: #2ecc71;' : 'color: #e74c3c; font-weight: bold;'
      );
    },

    pollDetails: (pollId: bigint, title: string, ended: boolean, totalVotes: bigint, options: any[]) => {
      console.group(
        `%c📋 SZCZEGÓŁY ANKIETY #${pollId.toString()}`,
        `color: ${this.colors.poll}; font-weight: bold;`
      );
      console.log('📝 Tytuł:', title);
      console.log('🔚 Status:', ended ? 'ZAKOŃCZONA' : 'AKTYWNA');
      console.log('🗳️ Łączne głosy:', totalVotes.toString());
      console.log('📊 Opcje głosowania:', options);
      console.groupEnd();
    },

    // NOWE: Szczegóły opcji głosowania z liczbą głosów
    pollOptionsWithVotes: (pollId: bigint, optionNames: string[], voteCounts: bigint[]) => {
      console.group(
        `%c📊 GŁOSY W ANKIECIE #${pollId.toString()}`,
        `color: ${this.colors.data}; font-weight: bold;`
      );
      optionNames.forEach((option, index) => {
        console.log(
          `📋 ${option}: ${voteCounts[index]?.toString() || 0} głosów`
        );
      });
      
      const totalVotes = voteCounts.reduce((sum, votes) => sum + Number(votes), 0);
      console.log(`📈 Łącznie: ${totalVotes} głosów`);
      console.groupEnd();
    },

    votingError: (pollId: bigint, error: any, userAddress?: string) => {
      console.group(
        `%c❌ BŁĄD GŁOSOWANIA - Ankieta #${pollId.toString()}`,
        `color: ${this.colors.error}; font-weight: bold;`
      );
      console.log('👤 Użytkownik:', userAddress || 'Niepołączony');
      console.log('💥 Błąd:', error);
      
      // Analiza typowych błędów głosowania
      if (error?.message?.includes('Already voted')) {
        console.log('🔍 DIAGNOSTYKA: Użytkownik już głosował w tej ankiecie');
      } else if (error?.message?.includes('Poll ended')) {
        console.log('🔍 DIAGNOSTYKA: Ankieta już się zakończyła');
      } else if (error?.message?.includes('Invalid option')) {
        console.log('🔍 DIAGNOSTYKA: Nieprawidłowy indeks opcji');
      } else if (error?.message?.includes('Poll not found')) {
        console.log('🔍 DIAGNOSTYKA: Ankieta nie istnieje');
      } else if (error?.message?.includes('Brak hash transakcji')) {
        console.log('🔍 DIAGNOSTYKA: Problem z uzyskaniem hash transakcji');
      }
      
      console.groupEnd();
    },

    // NOWE: Stan głosowania użytkownika
    userVotingStatus: (pollId: bigint, hasVoted: boolean, userAddress: string) => {
      console.log(
        `%c👤 STATUS GŁOSOWANIA` +
        `%c\n🗳️ Ankieta: #${pollId.toString()}` +
        `%c\n📍 Użytkownik: ${userAddress}` +
        `%c\n✅ Zagłosował: ${hasVoted ? 'TAK' : 'NIE'}`,
        `color: ${this.colors.info}; font-weight: bold;`,
        'color: #34495e;',
        'color: #34495e;',
        hasVoted ? 'color: #2ecc71; font-weight: bold;' : 'color: #e74c3c; font-weight: bold;'
      );
    }
  };

  // 4. DEBUG NAGRÓD I TOKENÓW
  rewardDebug = {
    pendingRewards: (address: string, pendingRewards: bigint, totalPollsCreated: bigint) => {
      console.log(
        `%c🎁 STATUS NAGRÓD` +
        `%c\n👤 Użytkownik: ${address}` +
        `%c\n📊 Stworzone ankiety: ${totalPollsCreated.toString()}` +
        `%c\n💰 Oczekujące nagrody: ${(Number(pendingRewards) / 1e18).toFixed(2)} VOTE` +
        `%c\n📈 Progres: ${Number(totalPollsCreated) % 10}/10 do następnej nagrody`,
        `color: ${this.colors.info}; font-weight: bold;`,
        'color: #34495e;',
        'color: #34495e;',
        Number(pendingRewards) > 0 ? 'color: #f39c12; font-weight: bold;' : 'color: #34495e;',
        'color: #34495e;'
      );
    },

    rewardClaim: (address: string, amount: bigint, txHash: string) => {
      console.log(
        `%c🎉 NAGRODA ODEBRANA!` +
        `%c\n👤 Użytkownik: ${address}` +
        `%c\n💰 Kwota: ${(Number(amount) / 1e18).toFixed(2)} VOTE` +
        `%c\n📫 TX Hash: ${txHash}`,
        `color: ${this.colors.success}; font-weight: bold;`,
        'color: #34495e;',
        'color: #2ecc71; font-weight: bold;',
        'color: #3498db; text-decoration: underline;'
      );
    },

    rewardError: (address: string, error: any) => {
      console.group(
        `%c❌ BŁĄD ODBIERANIA NAGRÓD`,
        `color: ${this.colors.error}; font-weight: bold;`
      );
      console.log('👤 Użytkownik:', address);
      console.log('💥 Błąd:', error);
      
      if (error?.message?.includes('No reward')) {
        console.log('🔍 DIAGNOSTYKA: Brak oczekujących nagród do odebrania');
      } else if (error?.message?.includes('Exceeds max supply')) {
        console.log('🔍 DIAGNOSTYKA: Przekroczono maksymalną podaż tokenów');
      }
      
      console.groupEnd();
    }
  };

  // 5. DEBUG PERFORMANCE I ŁADOWANIA
  performanceDebug = {
    componentRender: (componentName: string, props: any, state: any) => {
      console.group(
        `%c⚡ RENDER: ${componentName}`,
        `color: #95a5a6; font-weight: bold;`
      );
      console.log('📦 Props:', props);
      console.log('🔄 State:', state);
      console.groupEnd();
    },

    dataLoading: (dataType: string, startTime: number, dataCount: number) => {
      const loadTime = Date.now() - startTime;
      console.log(
        `%c📥 ŁADOWANIE DANYCH: ${dataType}` +
        `%c\n⏱️ Czas: ${loadTime}ms` +
        `%c\n📊 Rekordów: ${dataCount}` +
        `%c\n📈 Status: ${loadTime < 1000 ? 'OPTIMAL' : loadTime < 3000 ? 'SLOW' : 'CRITICAL'}`,
        `color: #95a5a6; font-weight: bold;`,
        'color: #34495e;',
        'color: #34495e;',
        loadTime < 1000 ? 'color: #2ecc71;' : loadTime < 3000 ? 'color: #f39c12;' : 'color: #e74c3c; font-weight: bold;'
      );
    },

    // NOWE: Czas ładowania hooków
    hookLoading: (hookName: string, loading: boolean, data: any, error: any) => {
      console.log(
        `%c🎣 HOOK: ${hookName}` +
        `%c\n⏳ Loading: ${loading}` +
        `%c\n📊 Data:`, data,
        `%c\n❌ Error:`, error,
        `color: ${this.colors.data}; font-weight: bold;`,
        loading ? 'color: #f39c12; font-weight: bold;' : 'color: #34495e;',
        'color: #34495e;',
        error ? 'color: #e74c3c; font-weight: bold;' : 'color: #34495e;'
      );
    }
  };

  // 6. GLOBALNE DEBUG FUNKCJE
  systemCheck = () => {
    console.group(
      `%c🔍 SYSTEM CHECK - HUB VOTE`,
      `color: #8e44ad; font-weight: bold; font-size: 14px;`
    );
    
    // Sprawdzenie środowiska
    console.log('🌐 Environment:', import.meta.env.MODE);
    console.log('🔗 Contract Address:', import.meta.env.VITE_CONTRACT_ADDRESS || '0xd12B01c658c4B563ACaDfC84997ea8270afdDd64');
    console.log('📱 Window.ethereum:', !!window.ethereum);
    console.log('💳 AppKit Project ID:', import.meta.env.VITE_APPKIT_PROJECT_ID ? '✅' : '❌');
    
    // Sprawdzenie localStorage
    const userProfile = localStorage.getItem('hub_vote_user_profile');
    console.log('👤 User Profile:', userProfile ? '✅' : '❌');
    
    // Sprawdzenie ważnych zmiennych
    console.log('📊 Screen Size:', `${window.innerWidth}x${window.innerHeight}`);
    console.log('⚡ React Version:', React?.version || 'Unknown');
    console.log('🔧 Vite Version:', import.meta.env.VITE_VERSION || 'Unknown');
    
    console.groupEnd();
  };

  // 7. NOWE: DEBUG UI I INTERAKCJI
  uiDebug = {
    modalState: (modalName: string, isOpen: boolean, props: any) => {
      console.log(
        `%c🪟 MODAL: ${modalName}` +
        `%c\n🔓 Otwarty: ${isOpen}` +
        `%c\n⚙️ Props:`, props,
        `color: ${this.colors.info}; font-weight: bold;`,
        isOpen ? 'color: #2ecc71; font-weight: bold;' : 'color: #e74c3c; font-weight: bold;',
        'color: #34495e;'
      );
    },

    buttonClick: (buttonName: string, disabled: boolean, loading: boolean) => {
      console.log(
        `%c🖱️ BUTTON: ${buttonName}` +
        `%c\n🚫 Wyłączony: ${disabled}` +
        `%c\n⏳ Ładowanie: ${loading}`,
        `color: ${this.colors.info}; font-weight: bold;`,
        disabled ? 'color: #e74c3c; font-weight: bold;' : 'color: #34495e;',
        loading ? 'color: #f39c12; font-weight: bold;' : 'color: #34495e;'
      );
    },

    formState: (formName: string, values: any, errors: any) => {
      console.group(
        `%c📝 FORM: ${formName}`,
        `color: ${this.colors.info}; font-weight: bold;`
      );
      console.log('📋 Wartości:', values);
      console.log('❌ Błędy:', errors);
      console.groupEnd();
    }
  };

  enableDebug() {
    this.isEnabled = true;
    console.log('%c🔧 DEBUG ENABLED', 'color: #2ecc71; font-weight: bold; font-size: 16px;');
  }

  disableDebug() {
    this.isEnabled = false;
    console.log('%c🔧 DEBUG DISABLED', 'color: #e74c3c; font-weight: bold; font-size: 16px;');
  }
}

// Singleton instance
export const debugLogger = new DebugLogger();

// Global debug function dla szybkiego dostępu
export const debug = {
  log: (message: string, data?: any) => {
    console.log(`%c🔧 ${message}`, 'color: #3498db; font-weight: bold;', data);
  },
  error: (message: string, error?: any) => {
    console.error(`%c❌ ${message}`, 'color: #e74c3c; font-weight: bold;', error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`%c⚠️ ${message}`, 'color: #f39c12; font-weight: bold;', data);
  },
  success: (message: string, data?: any) => {
    console.log(`%c✅ ${message}`, 'color: #2ecc71; font-weight: bold;', data);
  }
};

// Automatyczne uruchomienie system check przy imporcie
if (typeof window !== 'undefined') {
  setTimeout(() => {
    debugLogger.systemCheck();
  }, 1000);
}