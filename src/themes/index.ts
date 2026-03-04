import { sectionsRegistry as defaultRegistry } from './default/registry';
import { sectionsRegistry as eleganceRegistry } from './elegance/registry';
import { sectionsRegistry as technovaRegistry } from './technova/registry';
import { sectionsRegistry as cozyhomeRegistry } from './cozyhome/registry';
import { sectionsRegistry as luxeRegistry } from './luxe/registry';
import { sectionsRegistry as glowRegistry } from './glow/registry';
import { sectionsRegistry as activeplusRegistry } from './activeplus/registry';
import { sectionsRegistry as freshcartRegistry } from './freshcart/registry';
import { sectionsRegistry as kidswonderRegistry } from './kidswonder/registry';

export const themeRegistries: Record<string, Record<string, React.ComponentType<any>>> = {
    default: defaultRegistry,
    elegance: eleganceRegistry,
    technova: technovaRegistry,
    cozyhome: cozyhomeRegistry,
    luxe: luxeRegistry,
    glow: glowRegistry,
    activeplus: activeplusRegistry,
    freshcart: freshcartRegistry,
    kidswonder: kidswonderRegistry,
};
