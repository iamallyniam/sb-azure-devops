import React, { useContext, useEffect, useMemo, useState } from "react";
import { DocsContext, Unstyled, type Of } from "@storybook/addon-docs/blocks";
import type {
  WorkItem,
  WorkItemType,
} from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";

import { azureLinkItem } from "../helpers/links";
import { DEFAULT_LANG, errorMessage, simpleMessage } from "../messages";
import { devopsReq } from "./ServerRequests";

interface AzureDevopsConfig {
  org?: string;
  project?: string;
  key?: string;
}

interface WorkItemResponse {
  value: WorkItem[];
}

interface WorkItemTypeResponse {
  value: WorkItemType[];
}

/**
 * A resolved work item ready to render: the pieces we surface in the list, plus
 * the raw id used to build the deep link into Azure Devops.
 */
interface ResolvedWorkItem {
  id: string;
  title: string;
  type: string;
  state: string;
  iconUrl: string;
  originalEstimate: number;
  completedWork: number;
  remainingWork: number;
}

// Azure Devops reference names for the scheduling (effort) fields, in hours.
const FIELD_ORIGINAL_ESTIMATE = "Microsoft.VSTS.Scheduling.OriginalEstimate";
const FIELD_COMPLETED_WORK = "Microsoft.VSTS.Scheduling.CompletedWork";
const FIELD_REMAINING_WORK = "Microsoft.VSTS.Scheduling.RemainingWork";

// Work item types are grouped along the bar in this order (Tasks first, then
// Bugs); any other types that carry effort follow, sorted by name.
const TYPE_ORDER = ["Task", "Bug"];

/** Simple pluralisation for the effort breakdown labels (Task -> Tasks). */
const pluralise = (type: string): string => {
  if (!type) {
    return "Other";
  }
  return /s$/i.test(type) ? type : `${type}s`;
};

/** Coerce an Azure Devops field value to a number, treating anything invalid as 0. */
const toHours = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

/** Format an hours total for display: at most 2 decimals, no trailing zeros. */
const formatHours = (value: number): string => {
  return `${Number(value.toFixed(2))}h`;
};

export interface WorkItemsListProps {
  /**
   * A reference to the stories file (its `meta`/default export) or a single
   * story whose work items should be listed. When omitted, the work items of
   * every story on the current docs page are collected.
   *
   * @example <WorkItemsList of={ButtonStories} />
   */
  of?: Of;
  /**
   * Optional heading rendered above the list. Pass an empty string to hide it.
   */
  title?: string;
}

// Scoped, theme-independent styles. This component is bundled into a consuming
// project's docs iframe, where the Storybook `theming` ThemeProvider context is
// not reliably available across the package boundary — so we self-style with
// CSS custom properties and a `prefers-color-scheme` dark mode, mirroring the
// approach used by the addon panel's `workItemStyles`.
const styles = /* css */ `
.azWorkItemsList{
  --az-bg: #ffffff;
  --az-text: #1b1b1b;
  --az-muted: #6f6f6f;
  --az-link: #0a7cd6;
  --az-border: #e3e3e3;
  --az-green: #2f9e44;
  --az-red: #d9382c;
  --az-radius: 6px;
  font-family: -apple-system, ".SFNSText-Regular", "San Francisco", "Segoe UI", "Helvetica Neue", "Lucida Grande", sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: var(--az-text);
  margin: 16px 0;
}
@media (prefers-color-scheme: dark){
  .azWorkItemsList{
    --az-bg: #2e2e2e;
    --az-text: #f6f6f6;
    --az-muted: #a0a0a0;
    --az-link: #4ea3ff;
    --az-border: #454545;
    --az-green: #51cf66;
    --az-red: #ff6b6b;
  }
}
.azWorkItemsList__heading{
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 12px;
}
.azWorkItemsList__list{
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-flow: column nowrap;
  gap: 8px;
}
.azWorkItemsList__item{
  display: grid;
  grid-template-columns: 20px 1fr auto;
  grid-template-areas: "icon title state";
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid var(--az-border);
  border-radius: var(--az-radius);
  background: var(--az-bg);
}
.azWorkItemsList__icon{
  grid-area: icon;
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.azWorkItemsList__link{
  grid-area: title;
  color: var(--az-link);
  font-weight: 700;
  text-decoration: none;
}
.azWorkItemsList__link:hover,
.azWorkItemsList__link:focus-visible{
  text-decoration: underline;
}
.azWorkItemsList__id{
  color: var(--az-muted);
  font-weight: 400;
  margin-right: 6px;
}
.azWorkItemsList__state{
  grid-area: state;
  font-size: 12px;
  color: var(--az-muted);
  white-space: nowrap;
}
.azWorkItemsList__message{
  margin: 0;
  color: var(--az-muted);
}
.azWorkItemsList__error{
  margin: 0;
  color: var(--az-red);
}
.azWorkItemsList__loading{
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--az-muted);
}
.azWorkItemsList__spinner{
  width: 14px;
  height: 14px;
  border: 2px solid var(--az-border);
  border-top-color: var(--az-link);
  border-radius: 50%;
  animation: azWorkItemsSpin 0.8s linear infinite;
}
@keyframes azWorkItemsSpin{
  to{ transform: rotate(360deg); }
}
.azWorkItemsList__progress{
  margin-top: 16px;
}
/* Labelled marker sitting above the bar, pointing down to where the original
   estimate falls along it. */
.azWorkItemsList__estimateTrack{
  position: relative;
  height: 18px;
  margin-bottom: 2px;
}
.azWorkItemsList__estimateMarker{
  position: absolute;
  bottom: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--az-text);
}
.azWorkItemsList__estimateLabel{
  font-size: 11px;
  line-height: 1;
  font-weight: 700;
  white-space: nowrap;
  padding: 0 3px;
  background: var(--az-bg);
  border-radius: 3px;
}
.azWorkItemsList__estimateMarker::after{
  content: "";
  width: 0;
  height: 0;
  margin-top: 2px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid var(--az-text);
}
.azWorkItemsList__bar{
  position: relative;
  display: flex;
  width: 100%;
  height: 14px;
  background: var(--az-border);
  border-radius: 7px;
  overflow: hidden;
}
.azWorkItemsList__seg{
  height: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.azWorkItemsList__seg.az--under{ background: var(--az-green); }
.azWorkItemsList__seg.az--over{ background: var(--az-red); }
/* Divider between work item type groups (e.g. Tasks | Bugs). */
.azWorkItemsList__seg.az--groupStart{
  border-left: 2px solid var(--az-bg);
}
/* Remaining work is projected effort, so it reads as a striped extension of
   the solid completed segment while keeping the same over/under colour. */
.azWorkItemsList__seg.az--remaining{
  background-image: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.35) 0 4px,
    rgba(255, 255, 255, 0) 4px 8px
  );
}
.azWorkItemsList__estimate{
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--az-text);
  box-shadow: 0 0 0 1px var(--az-bg);
}
/* Bracketed labels beneath the bar marking each type's region (Tasks | Bugs).
   Widths mirror the bar segments so each label sits under its own work. */
.azWorkItemsList__marks{
  display: flex;
  width: 100%;
  margin-top: 4px;
}
.azWorkItemsList__mark{
  position: relative;
  min-width: 0;
  box-sizing: border-box;
  border-top: 1px solid var(--az-muted);
  border-left: 1px solid var(--az-muted);
  border-right: 1px solid var(--az-muted);
  padding: 4px 4px 0;
}
.azWorkItemsList__markLabel{
  display: block;
  font-size: 11px;
  line-height: 1.2;
  color: var(--az-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}
.azWorkItemsList__key,
.azWorkItemsList__breakdown{
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  font-size: 12px;
  color: var(--az-muted);
}
.azWorkItemsList__keyItem,
.azWorkItemsList__breakdownItem{
  display: flex;
  align-items: center;
  gap: 6px;
  margin-inline: 0 auto;
  margin-block: 0 auto;
}
.azWorkItemsList__type{
  font-weight: 700;
  color: var(--az-text);
}
.azWorkItemsList__swatch{
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
  flex: none;
}
.azWorkItemsList__swatch.az--estimate{ background: var(--az-text); }
.azWorkItemsList__swatch.az--solid{ background: var(--az-muted); }
.azWorkItemsList__swatch.az--remaining{
  background-image: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.45) 0 3px,
    rgba(255, 255, 255, 0) 3px 6px
  );
}
.azWorkItemsList__caption{
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--az-muted);
}
`;

/**
 * Collect the `workItems` parameter across a set of stories, de-duplicating ids
 * while preserving the order they were first encountered.
 */
const collectWorkItemIds = (
  stories: Array<{ parameters?: { workItems?: unknown } }>,
): string[] => {
  const ids: string[] = [];
  const seen = new Set<string>();
  stories.forEach((story) => {
    const workItems = story.parameters?.workItems;
    if (Array.isArray(workItems)) {
      workItems.forEach((item) => {
        const id = String(item);
        if (id && !seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      });
    }
  });
  return ids;
};

/**
 * Lists the Azure Devops work items associated with the stories on a docs page.
 *
 * Reads the `workItems` parameter from each story (the same parameter the addon
 * panel uses) and the `azureDevops` global for connection details, then fetches
 * each work item's title, type and state from Azure Devops for display.
 */
export const WorkItemsList: React.FC<WorkItemsListProps> = ({ of, title }) => {
  const docsContext = useContext(DocsContext);
  const userLang = document?.documentElement?.lang || DEFAULT_LANG;

  // Resolve the stories in scope, then the ids and connection config from them.
  const { workItemIds, config } = useMemo(() => {
    let stories = docsContext.componentStories();
    if (of) {
      const resolved = docsContext.resolveOf(of, ["meta", "story"]);
      if (resolved.type === "meta") {
        stories = docsContext.componentStoriesFromCSFFile(resolved.csfFile);
      } else {
        stories = [resolved.story];
      }
    }
    const azureDevops = stories.length
      ? ((docsContext.getStoryContext(stories[0]).globals?.azureDevops ??
          {}) as AzureDevopsConfig)
      : {};
    return {
      workItemIds: collectWorkItemIds(stories),
      config: azureDevops,
    };
  }, [docsContext, of]);

  const [items, setItems] = useState<ResolvedWorkItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const idsKey = workItemIds.join(",");
  const { org = "", project = "", key = "" } = config;

  useEffect(() => {
    if (workItemIds.length === 0) {
      setItems([]);
      setIsLoading(false);
      setError("");
      return;
    }
    if (!key || !org) {
      // Surface the same guidance the panel gives when config is missing.
      setItems(null);
      setIsLoading(false);
      setError(simpleMessage(userLang, "errorAzureKey"));
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    const request = <T,>(requestStr: string, apiVersion?: string): Promise<T> =>
      devopsReq(
        key,
        org,
        project,
        requestStr,
        "GET",
        "",
        "",
        apiVersion ?? "api-version=6.0",
        userLang,
      ) as Promise<T>;

    Promise.all([
      request<WorkItemResponse>(
        `wit/workitems?ids=${workItemIds.join(",")}&$expand=fields`,
      ),
      request<WorkItemTypeResponse>("wit/workitemtypes", "api-version=7.1"),
    ])
      .then(([workItemsResp, typesResp]) => {
        if (cancelled) {
          return;
        }
        const iconByType = new Map<string, string>();
        typesResp.value.forEach((type) => {
          if (type.name) {
            iconByType.set(type.name, type.icon?.url ?? "");
          }
        });

        // Preserve the authored id order rather than the API's response order.
        const byId = new Map<string, WorkItem>();
        workItemsResp.value.forEach((item) => {
          byId.set(String(item.id), item);
        });

        const resolved: ResolvedWorkItem[] = workItemIds
          .map((id) => byId.get(id))
          .filter((item): item is WorkItem => Boolean(item))
          .map((item) => {
            const type = String(item.fields?.["System.WorkItemType"] ?? "");
            const fields = item.fields ?? {};
            return {
              id: String(item.id),
              title: String(item.fields?.["System.Title"] ?? ""),
              type,
              state: String(item.fields?.["System.State"] ?? ""),
              iconUrl: iconByType.get(type) ?? "",
              originalEstimate: toHours(fields[FIELD_ORIGINAL_ESTIMATE]),
              completedWork: toHours(fields[FIELD_COMPLETED_WORK]),
              remainingWork: toHours(fields[FIELD_REMAINING_WORK]),
            };
          });

        setItems(resolved);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        console.log(err);
        setItems(null);
        setIsLoading(false);
        setError(errorMessage(userLang, ["azureWorkItems"], idsKey));
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey, org, project, key, userLang]);

  // Sum the effort fields across all resolved items to drive the progress bar,
  // broken down by work item type. Scale is capped to the larger of the
  // estimate or the actual consumed work (completed + remaining) so an overrun
  // stays visible within the bar.
  const effort = useMemo(() => {
    const list = items ?? [];
    const estimate = list.reduce((sum, i) => sum + i.originalEstimate, 0);
    const completed = list.reduce((sum, i) => sum + i.completedWork, 0);
    const remaining = list.reduce((sum, i) => sum + i.remainingWork, 0);
    const scaleMax = Math.max(estimate, completed + remaining);

    // Aggregate completed/remaining/estimate per work item type.
    const byType = new Map<
      string,
      { completed: number; remaining: number; estimate: number }
    >();
    list.forEach((item) => {
      const type = item.type || "Other";
      const totals = byType.get(type) ?? {
        completed: 0,
        remaining: 0,
        estimate: 0,
      };
      totals.completed += item.completedWork;
      totals.remaining += item.remainingWork;
      totals.estimate += item.originalEstimate;
      byType.set(type, totals);
    });

    // Order groups: Tasks first, Bugs next, then any other types by name.
    const orderedTypes = [
      ...TYPE_ORDER.filter((type) => byType.has(type)),
      ...[...byType.keys()].filter((type) => !TYPE_ORDER.includes(type)).sort(),
    ];
    const groups = orderedTypes.map((type) => ({
      type,
      ...byType.get(type)!,
    }));

    // Build the ordered bar segments: for each type group, completed then
    // remaining. Colour is decided by whether the running cumulative total has
    // passed the original estimate at the end of that segment.
    const EPSILON = 1e-9;
    const segments: Array<{
      key: string;
      type: string;
      kind: "completed" | "remaining";
      value: number;
      widthPct: number;
      over: boolean;
      groupStart: boolean;
    }> = [];
    let running = 0;
    groups.forEach((group) => {
      let firstOfGroup = true;
      (["completed", "remaining"] as const).forEach((kind) => {
        const value = group[kind];
        if (value > 0) {
          running += value;
          segments.push({
            key: `${group.type}-${kind}`,
            type: group.type,
            kind,
            value,
            widthPct: scaleMax > 0 ? (value / scaleMax) * 100 : 0,
            over: running > estimate + EPSILON,
            // Divider before the first segment of each group after the first.
            groupStart: firstOfGroup && segments.length > 0,
          });
          firstOfGroup = false;
        }
      });
    });

    // Per-type original estimate markers (Tasks, then Bugs), positioned
    // cumulatively along the same hours axis as the bar segments: the Task
    // marker points to where tasks were expected to be delivered, the Bug
    // marker to where tasks + bugs were expected to be delivered.
    const estimateMarkers: Array<{
      key: string;
      label: string;
      hours: number;
      pct: number;
    }> = [];
    let cumulativeEstimate = 0;
    ([
      ["Task", "Tasks"],
      ["Bug", "Bugs"],
    ] as const).forEach(([type, label]) => {
      const typeEstimate = byType.get(type)?.estimate ?? 0;
      cumulativeEstimate += typeEstimate;
      if (typeEstimate > 0) {
        estimateMarkers.push({
          key: type,
          label,
          hours: typeEstimate,
          pct: scaleMax > 0 ? (cumulativeEstimate / scaleMax) * 100 : 0,
        });
      }
    });

    return {
      estimate,
      completed,
      remaining,
      hasData: scaleMax > 0,
      estimateMarkers,
      segments,
      groups: groups
        .filter((group) => group.completed + group.remaining > 0)
        .map((group) => ({
          ...group,
          // Total width of this type's region on the bar, used to place the
          // group label/bracket beneath it.
          widthPct:
            scaleMax > 0
              ? ((group.completed + group.remaining) / scaleMax) * 100
              : 0,
        })),
    };
  }, [items]);

  const headingText = title;

  return (
    <Unstyled>
      <div className="azWorkItemsList">
        <style>{styles}</style>
        {headingText && <h3>{headingText}</h3>}
        {error && <p className="azWorkItemsList__error">{error}</p>}
        {!error && isLoading && (
          <p className="azWorkItemsList__loading" aria-live="polite">
            <span className="azWorkItemsList__spinner" aria-hidden="true" />
            Loading work items
          </p>
        )}
        {!error && !isLoading && items && items.length === 0 && (
          <p className="azWorkItemsList__message">
            {simpleMessage(userLang, "noWorkItemsSet")}
          </p>
        )}
        {!error && !isLoading && items && items.length > 0 && (
          <ul className="azWorkItemsList__list">
            {items.map((item) => (
              <li className="azWorkItemsList__item" key={item.id}>
                {item.iconUrl && (
                  <img
                    className="azWorkItemsList__icon"
                    src={item.iconUrl}
                    alt={item.type}
                  />
                )}
                <a
                  className="azWorkItemsList__link"
                  href={azureLinkItem("https", "dev.azure.com", org, item.id)}
                  target="_blank"
                  rel="nofollow noreferrer noopener"
                >
                  <span className="azWorkItemsList__id">#{item.id}</span>
                  {item.title}
                </a>
                {item.state && (
                  <span className="azWorkItemsList__state">{item.state}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {!error && !isLoading && effort.hasData && (
          <div className="azWorkItemsList__progress">
            {effort.estimateMarkers.length > 0 && (
              <div className="azWorkItemsList__estimateTrack" aria-hidden="true">
                {effort.estimateMarkers.map((marker, i) => (
                  <div
                    key={marker.key}
                    className="azWorkItemsList__estimateMarker"
                    style={{ left: `${marker.pct}%`, zIndex: i + 1 }}
                  >
                    <span className="azWorkItemsList__estimateLabel">
                      {marker.label} est. {formatHours(marker.hours)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div
              className="azWorkItemsList__bar"
              role="img"
              aria-label={`Effort: ${formatHours(effort.completed)} completed and ${formatHours(effort.remaining)} remaining against an original estimate of ${formatHours(effort.estimate)}, broken down by work item type.`}
            >
              {effort.segments.map((seg) => (
                <div
                  key={seg.key}
                  className={[
                    "azWorkItemsList__seg",
                    seg.over ? "az--over" : "az--under",
                    seg.kind === "remaining" ? "az--remaining" : "",
                    seg.groupStart ? "az--groupStart" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ width: `${seg.widthPct}%` }}
                  title={`${seg.type} ${seg.kind}: ${formatHours(seg.value)}`}
                />
              ))}
              {effort.estimateMarkers.map((marker) =>
                marker.pct > 0 && marker.pct < 100 ? (
                  <div
                    key={marker.key}
                    className="azWorkItemsList__estimate"
                    style={{ left: `${marker.pct}%` }}
                    aria-hidden="true"
                  />
                ) : null,
              )}
            </div>
            <div className="azWorkItemsList__marks" aria-hidden="true">
              {effort.groups.map((group) => (
                <div
                  key={group.type}
                  className="azWorkItemsList__mark"
                  style={{ width: `${group.widthPct}%` }}
                  title={`${pluralise(group.type)}: ${formatHours(
                    group.completed + group.remaining,
                  )}`}
                >
                  <span className="azWorkItemsList__markLabel">
                    {pluralise(group.type)} ·{" "}
                    {formatHours(group.completed + group.remaining)}
                  </span>
                </div>
              ))}
            </div>
            <ul className="azWorkItemsList__key">
              <li className="azWorkItemsList__keyItem">
                <span className="azWorkItemsList__swatch az--estimate" />
                Original estimate: {formatHours(effort.estimate)}
              </li>
              <li className="azWorkItemsList__keyItem">
                <span className="azWorkItemsList__swatch az--solid" />
                Completed
              </li>
              <li className="azWorkItemsList__keyItem">
                <span className="azWorkItemsList__swatch az--solid az--remaining" />
                Remaining
              </li>
            </ul>
            <ul className="azWorkItemsList__breakdown">
              {effort.groups.map((group) => (
                <li className="azWorkItemsList__breakdownItem" key={group.type}>
                  <span className="azWorkItemsList__type">
                    {pluralise(group.type)}
                  </span>
                  {formatHours(group.completed)} completed ·{" "}
                  {formatHours(group.remaining)} remaining
                </li>
              ))}
            </ul>
            <p className="azWorkItemsList__caption">
              Green is within the original estimate, red is over.
            </p>
          </div>
        )}
      </div>
    </Unstyled>
  );
};

export default WorkItemsList;
