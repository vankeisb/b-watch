echo "Yalla"

yarn install && \
echo "*** common ***" && \
cd common && yarn build && cd .. && \
echo "*** daemon ***" && \
cd daemon && yarn build && cd .. && \
echo "*** common-front ***" && \
cd common-front && yarn build && cd .. && \
echo "*** frontend ***" && \
cd frontend && yarn build && cd .. && \
echo "*** electron-app ***" && \
cd electron-app && yarn clean && yarn compile # && yarn dist \
