FROM kalilinux/kali-rolling

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    nmap nikto dirb hydra sqlmap curl jq \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /audit

COPY security-audit.sh /audit/
COPY generate-report.sh /audit/

RUN chmod +x /audit/security-audit.sh /audit/generate-report.sh

CMD ["bash"]
