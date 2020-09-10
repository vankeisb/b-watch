yarn install && \
cd common && yarn build && cd .. && \
cd daemon && yarn build && cd .. && \
cd common-front && yarn build && cd .. && \
cd frontend && yarn build && cd .. && \
cd electron-app && yarn clean && yarn compile && yarn pack \
