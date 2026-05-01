"use client";

import {
  Activity,
  Camera,
  Image as ImageIcon,
  TrendingUp,
  UploadCloud,
  Users,
} from "lucide-react";

const monthlyUploads = [
  { month: "Jan", images: 180, users: 22 },
  { month: "Feb", images: 240, users: 30 },
  { month: "Mar", images: 310, users: 36 },
  { month: "Apr", images: 290, users: 28 },
  { month: "May", images: 360, users: 44 },
  { month: "Jun", images: 420, users: 51 },
];

const categoryBreakdown = [
  { label: "Plants", value: 43, color: "bg-emerald-500" },
  { label: "Birds", value: 25, color: "bg-sky-500" },
  { label: "Mammals", value: 18, color: "bg-amber-500" },
  { label: "Insects", value: 14, color: "bg-violet-500" },
];

const recentActivity = [
  { action: "New admin user registered", time: "2 mins ago" },
  { action: "42 new species images uploaded", time: "17 mins ago" },
  { action: "Geolocation batch synced", time: "1 hour ago" },
  { action: "Daily analytics report generated", time: "3 hours ago" },
];

export default function AdminDashboard() {
  const maxImage = Math.max(...monthlyUploads.map((item) => item.images));

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50/80 p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">
                Admin analytics
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Biodiversity Overview
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Monitoring platform growth, species images, and activity trends.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              <TrendingUp className="size-4" />
              +12.4% this month
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total Users</p>
              <Users className="size-4 text-cyan-600" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">1,284</p>
            <p className="mt-1 text-xs text-emerald-600">+48 new this week</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total Images</p>
              <ImageIcon className="size-4 text-violet-600" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">8,942</p>
            <p className="mt-1 text-xs text-emerald-600">+356 uploads this week</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Species Indexed</p>
              <Camera className="size-4 text-amber-600" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">572</p>
            <p className="mt-1 text-xs text-emerald-600">+21 newly recognized</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Processing Queue</p>
              <UploadCloud className="size-4 text-blue-600" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">39</p>
            <p className="mt-1 text-xs text-slate-500">Awaiting classification</p>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Monthly Upload Trend
              </h2>
              <span className="text-xs text-slate-500">Last 6 months</span>
            </div>

            <div className="flex h-64 items-end gap-3">
              {monthlyUploads.map((entry) => (
                <div key={entry.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-52 w-full items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-400"
                      style={{ height: `${(entry.images / maxImage) * 100}%` }}
                      title={`${entry.images} images`}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{entry.month}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Image Categories</h2>
            <p className="mt-1 text-xs text-slate-500">
              Distribution of uploaded biodiversity images.
            </p>

            <div className="mt-5 space-y-4">
              {categoryBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="font-medium text-slate-900">{item.value}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="size-4 text-slate-600" />
            <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={`${item.action}-${item.time}`}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
              >
                <span className="text-sm text-slate-700">{item.action}</span>
                <span className="text-xs text-slate-500">{item.time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
