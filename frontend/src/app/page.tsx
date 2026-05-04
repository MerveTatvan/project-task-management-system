"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-blue-950/95" />

      <div className="absolute left-10 top-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" />
      <div className="absolute right-1/3 top-1/4 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
      <div className="absolute left-1/3 bottom-20 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl animate-pulse" />

      {/* Floating mini task cards */}
      <div className="pointer-events-none absolute left-8 top-24 hidden w-72 animate-float-slow rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl lg:block">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-100">Sprint Board</span>
          <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-[10px] text-emerald-200">
            Active
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {["Todo", "Doing", "Done"].map((title, i) => (
            <div key={title} className="rounded-2xl bg-white/10 p-2">
              <p className="mb-2 text-[10px] font-semibold text-white/80">{title}</p>
              <div className="space-y-2">
                <div className="h-8 rounded-xl bg-white/20" />
                <div className="h-6 rounded-xl bg-cyan-300/20" />
                {i !== 2 && <div className="h-5 rounded-xl bg-blue-300/20" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute right-10 top-20 hidden animate-float-medium rounded-2xl border border-white/15 bg-white/10 px-5 py-4 shadow-xl backdrop-blur-xl xl:block">
        <p className="text-xs text-blue-100">Project progress</p>
        <p className="mt-1 text-2xl font-bold text-white">78%</p>
        <div className="mt-3 h-2 w-36 rounded-full bg-white/15">
          <div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-blue-400 to-cyan-300" />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-24 right-10 hidden w-72 animate-float-slow rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl lg:block">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white">
            ✓
          </div>
          <div>
            <p className="text-sm font-bold text-white">Deadline Reminder</p>
            <p className="text-xs text-blue-100">Task due tomorrow</p>
          </div>
        </div>

        <div className="h-2 rounded-full bg-white/15">
          <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-blue-400 to-cyan-300" />
        </div>

        <div className="mt-4 flex -space-x-2">
          <div className="h-8 w-8 rounded-full border-2 border-white/30 bg-blue-400" />
          <div className="h-8 w-8 rounded-full border-2 border-white/30 bg-cyan-400" />
          <div className="h-8 w-8 rounded-full border-2 border-white/30 bg-indigo-400" />
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 bg-white/20 text-xs text-white">
            +5
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-24 bottom-20 hidden w-64 animate-float-medium rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl xl:block">
        <p className="text-xs font-semibold text-blue-100">Team Activity</p>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-cyan-400" />
            <div className="flex-1">
              <div className="h-2 w-24 rounded-full bg-white/30" />
              <div className="mt-2 h-2 w-32 rounded-full bg-white/15" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-400" />
            <div className="flex-1">
              <div className="h-2 w-28 rounded-full bg-white/30" />
              <div className="mt-2 h-2 w-20 rounded-full bg-white/15" />
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-[18%] top-[62%] hidden animate-bounce rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-xl backdrop-blur-xl lg:block">
        <p className="text-xs text-blue-100">New task assigned</p>
        <p className="mt-1 text-sm font-bold text-white">UI polish</p>
      </div>

      <div className="pointer-events-none absolute right-[22%] top-[18%] hidden animate-pulse rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-xl backdrop-blur-xl lg:block">
        <p className="text-xs text-blue-100">Notification</p>
        <p className="mt-1 text-sm font-bold text-white">3 unread</p>
      </div>

      <div className="pointer-events-none absolute left-[12%] top-[45%] hidden animate-float-fast rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-xl backdrop-blur-xl xl:block">
        <p className="text-xs text-blue-100">Request</p>
        <p className="mt-1 text-sm font-bold text-white">Pending approval</p>
      </div>

      <div className="pointer-events-none absolute right-[15%] bottom-[42%] hidden animate-float-fast rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-xl backdrop-blur-xl xl:block">
        <p className="text-xs text-blue-100">Project</p>
        <p className="mt-1 text-sm font-bold text-white">Mobile App</p>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/20 bg-white/10 p-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-blue-100 backdrop-blur">
          Project & Task Management System
        </div>

        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
          Organize work, assign tasks and track every project beautifully.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-blue-100">
          A modern workspace for teams to create projects, manage tasks,
          follow deadlines, receive notifications and keep workflows under control.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-white/15 p-4 text-white backdrop-blur transition hover:bg-white/20">
            <p className="text-lg font-bold">24/7</p>
            <p className="text-xs text-blue-100">Tracking</p>
          </div>

          <div className="rounded-2xl bg-white/15 p-4 text-white backdrop-blur transition hover:bg-white/20">
            <p className="text-lg font-bold">Team</p>
            <p className="text-xs text-blue-100">Based</p>
          </div>

          <div className="rounded-2xl bg-white/15 p-4 text-white backdrop-blur transition hover:bg-white/20">
            <p className="text-lg font-bold">Smart</p>
            <p className="text-xs text-blue-100">Workflow</p>
          </div>
        </div>

        <button
          onClick={() => router.push("/login")}
          className="mt-10 w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.02] hover:shadow-xl"
        >
          Login / Sign Up
        </button>
      </div>

      <style jsx>{`
        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-18px) translateX(8px);
          }
        }

        @keyframes floatMedium {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(16px) translateX(-10px);
          }
        }

        @keyframes floatFast {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-12px) scale(1.03);
          }
        }

        .animate-float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: floatMedium 5s ease-in-out infinite;
        }

        .animate-float-fast {
          animation: floatFast 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}