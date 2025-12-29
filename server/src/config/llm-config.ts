import fs from 'fs-extra';
import path from 'path';

export interface LLMProviderConfig {
  name: string;
  apiKey: string;
  baseURL?: string;
  models: string[];
}

export interface CurrentModelProvider {
  provider: string;
  model: string;
}

export interface LLMConfiguration {
  providers: LLMProviderConfig[];
  currentModelProvider: CurrentModelProvider;
}

class LLMConfig {
  private configPath: string;
  private config!: LLMConfiguration;

  constructor() {
    this.configPath = path.join(__dirname, '../../data/data.json');
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
      console.log('✅ LLM configuration loaded');
    } catch (error) {
      console.error('❌ Failed to load LLM config:', error);
      // Fallback to default config
      this.config = {
        providers: [],
        currentModelProvider: {
          provider: 'openai',
          model: 'gpt-4o-mini'
        }
      };
    }
  }

  reloadConfig(): void {
    this.loadConfig();
  }

  getConfig(): LLMConfiguration {
    return this.config;
  }

  getCurrentProvider(): CurrentModelProvider {
    return this.config.currentModelProvider;
  }

  getProvider(name: string): LLMProviderConfig | undefined {
    return this.config.providers.find(p => p.name === name);
  }

  getCurrentProviderConfig(): LLMProviderConfig | undefined {
    const current = this.getCurrentProvider();
    return this.getProvider(current.provider);
  }

  getProviderModels(providerName: string): string[] {
    const provider = this.getProvider(providerName);
    return provider?.models || [];
  }

  
}

export default new LLMConfig();