import { types, Instance, ISimpleType, getParentOfType } from "mobx-state-tree";
import * as G from '../game';
import { floor, GearColor, Store, gearData } from '.';

export const Food = types
  .model('Food', {
    id: types.identifierNumber as ISimpleType<G.GearId>,
  })
  .views(self => ({
    get data() {
      if (!gearData.has(self.id)) throw ReferenceError(`Food ${self.id} not exists.`);
      return gearData.get(self.id)! as G.Food;
    },
  }))
  .views(self => ({
    get isFood(): true { return true; },
    get name() { return self.data.name; },
    get level() { return self.data.level; },
    get slot() { return self.data.slot; },
    get jobs() { return G.jobCategories[self.data.jobCategory]; },
    get hq() { return true; },
    get patch() { return self.data.patch; },
    get color(): GearColor { return 'white'; },
    get stats(): G.Stats { return self.data.stats; },
    get statRates(): G.Stats { return self.data.statRates; },
    get requiredStats(): G.Stats {
      const stats: G.Stats = {};
      for (const stat of Object.keys(this.stats) as G.Stat[]) {
        const statRate = this.statRates[stat];
        if (statRate !== undefined) {
          stats[stat] = Math.ceil(this.stats[stat] * 100 / statRate);
        }
      }
      return stats;
    },
    get effectiveStats(): G.Stats {
      const store = getParentOfType(self, Store);
      const stats: G.Stats = {};
      for (const stat of Object.keys(this.stats) as G.Stat[]) {
        const equippedStat = store.equippedStatsWithoutFood[stat] ?? 1;
        const statRate = this.statRates[stat] ?? Infinity;
        stats[stat] = Math.min(this.stats[stat], floor(equippedStat * statRate / 100));
      }
      return stats;
    },
    get statHighlights(): { [index in G.Stat]?: Boolean } {
      return {
        [self.data.statMain]: true,
      };
    },
    get utilization(): number {
      let fullStat = 0;
      let effectiveStat = 0;
      for (const stat of Object.keys(this.stats) as G.Stat[]) {
        fullStat += this.stats[stat];
        effectiveStat += this.effectiveStats[stat];
      }
      return floor(effectiveStat / fullStat * 100);
    },
    get utilizationOpacity(): number {
      return Math.max(0.2, Math.pow(this.utilization / 100, 2));
    },
    get isInstalled(): boolean {
      return !(this.patch > G.versions.released);
    },
    get isEquipped(): boolean {
      const store = getParentOfType(self, Store);
      return store.equippedGears.get('-1') === self;
    },
  }));

export interface IFood extends Instance<typeof Food> {}
