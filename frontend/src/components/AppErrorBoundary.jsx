import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f5efe6_0%,#fbf8f3_100%)] px-6 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-outline-variant/15 bg-white/92 p-8 text-center shadow-[0_30px_80px_-50px_rgba(15,23,42,0.32)] sm:p-10">
            <p className="font-label text-[0.72rem] uppercase tracking-[0.3em] text-secondary">GOAT HOTEL</p>
            <h1 className="mt-5 font-headline text-3xl text-primary sm:text-4xl">Trang vừa gặp lỗi ngoài ý muốn</h1>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant sm:text-base">
              Hệ thống đã chặn lỗi để bạn không rơi vào màn hình trắng. Bạn có thể tải lại trang hoặc quay về trang chủ để tiếp tục thao tác.
            </p>
            {this.state.error?.message ? (
              <p className="mt-4 rounded-[20px] bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                {this.state.error.message}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center rounded-full bg-primary px-6 py-3 font-label text-[0.68rem] uppercase tracking-[0.24em] text-on-primary transition-all hover:brightness-105"
              >
                Tải lại trang
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center rounded-full border border-outline-variant/16 bg-white px-6 py-3 font-label text-[0.68rem] uppercase tracking-[0.24em] text-primary transition-all hover:border-secondary/35 hover:text-secondary"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
